import { extractEvidence } from '../agents/evidence.agent.js';
import { updateTimeline } from '../agents/timeline.agent.js';
import { analyzeCase } from '../agents/investigation.agent.js';
import {
  retainEvidenceList,
  retainTimelineList,
  retainInvestigationList,
  recallEvidenceList,
  recallTimelineList,
  recallInvestigationList
} from './hindsight.service.js';
import { query } from '../config/db.js';

/**
 * Run the full 3-agent pipeline for a newly uploaded document.
 *
 * Flow:
 * 1. Evidence Agent: extract structured evidence from PDF text
 * 2. Timeline Agent: recall existing evidence + timeline, generate updated timeline
 * 3. Investigation Agent: recall everything, find contradictions/patterns/gaps
 *
 * All outputs are stored in Hindsight memory.
 *
 * @param {string} caseId - UUID of the case
 * @param {string} documentId - UUID of the document (for status updates)
 * @param {string} pdfText - Extracted text from the PDF
 * @param {string} documentName - Original filename
 * @returns {Promise<object>} Pipeline results
 */
export const runPipeline = async (caseId, documentId, pdfText, documentName) => {
  try {
    // Mark document as processing
    await query(
      "UPDATE documents SET processing_status = $1 WHERE id = $2",
      ['processing', documentId]
    );

    console.log(`📄 [Pipeline] Starting for doc "${documentName}" in case ${caseId}`);

    // ──────────────────────────────────────────────
    // STEP 1: Evidence Agent
    // ──────────────────────────────────────────────
    console.log('🔍 [Pipeline] Step 1: Extracting evidence...');
    let newEvidence;
    try {
      newEvidence = await extractEvidence(pdfText, documentName);
    } catch (err) {
      throw new Error(`Evidence Agent failed: ${err.message}`);
    }
    console.log(`   Found ${newEvidence.length} evidence items`);

    // Store new evidence in Hindsight
    if (newEvidence.length > 0) {
      await retainEvidenceList(caseId, newEvidence);
    }

    // ──────────────────────────────────────────────
    // STEP 2: Timeline Agent
    // ──────────────────────────────────────────────
    console.log('📅 [Pipeline] Step 2: Updating timeline...');

    // Recall all evidence from memory
    let allEvidenceData = [];
    try {
      allEvidenceData = await recallEvidenceList(caseId);
    } catch (err) {
      console.warn('   Could not recall evidence, using new evidence only:', err.message);
      allEvidenceData = newEvidence;
    }

    // Recall existing timeline
    let existingTimeline = [];
    try {
      existingTimeline = await recallTimelineList(caseId);
    } catch (err) {
      console.warn('   No existing timeline found:', err.message);
    }

    let updatedTimeline;
    try {
      updatedTimeline = await updateTimeline(
        allEvidenceData.length > 0 ? allEvidenceData : newEvidence,
        existingTimeline
      );
    } catch (err) {
      throw new Error(`Timeline Agent failed: ${err.message}`);
    }
    console.log(`   Generated ${updatedTimeline.length} timeline entries`);

    // Store timeline in Hindsight
    if (updatedTimeline.length > 0) {
      await retainTimelineList(caseId, updatedTimeline);
    }

    // ──────────────────────────────────────────────
    // STEP 3: Investigation Agent
    // ──────────────────────────────────────────────
    console.log('🕵️ [Pipeline] Step 3: Running investigation analysis...');

    // Recall prior investigations
    let priorInvestigations = [];
    try {
      priorInvestigations = await recallInvestigationList(caseId);
    } catch (err) {
      console.warn('   No prior investigations found:', err.message);
    }

    let investigationFindings;
    try {
      investigationFindings = await analyzeCase(
        allEvidenceData.length > 0 ? allEvidenceData : newEvidence,
        updatedTimeline,
        priorInvestigations
      );
    } catch (err) {
      throw new Error(`Investigation Agent failed: ${err.message}`);
    }
    console.log(`   Generated ${investigationFindings.length} investigation findings`);

    // Store investigation results in Hindsight
    if (investigationFindings.length > 0) {
      await retainInvestigationList(caseId, investigationFindings);
    }

    // Update case contradictions count in PostgreSQL
    const contradictionsCount = investigationFindings.filter(f => f.type === 'contradiction').length;
    await query(
      'UPDATE cases SET contradictions_count = $1, updated_at = NOW() WHERE id = $2',
      [contradictionsCount, caseId]
    );

    // Mark document as completed
    await query(
      "UPDATE documents SET processing_status = $1 WHERE id = $2",
      ['completed', documentId]
    );

    console.log(`✅ [Pipeline] Completed for doc "${documentName}"`);

    return {
      evidence: newEvidence,
      timeline: updatedTimeline,
      investigations: investigationFindings,
    };
  } catch (error) {
    console.error(`❌ [Pipeline] Failed for doc "${documentName}":`, error.message);

    // Mark document as failed and store the error message
    await query(
      "UPDATE documents SET processing_status = $1, processing_error = $2 WHERE id = $3",
      ['failed', error.message || 'Unknown pipeline error', documentId]
    ).catch(() => {}); // don't let status update failure mask the real error

    throw error;
  }
};
