import { extractEvidence } from '../agents/evidence.agent.js';
import { updateTimeline } from '../agents/timeline.agent.js';
import { analyzeCase } from '../agents/investigation.agent.js';
import {
  recallMemory,
  retainEvidenceList,
  retainTimelineList,
  retainInvestigationList,
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
      'UPDATE documents SET processing_status = $1 WHERE id = $2',
      ['processing', documentId]
    );

    console.log(`📄 [Pipeline] Starting for doc "${documentName}" in case ${caseId}`);

    // ──────────────────────────────────────────────
    // STEP 1: Evidence Agent
    // ──────────────────────────────────────────────
    console.log('🔍 [Pipeline] Step 1: Extracting evidence...');
    const newEvidence = await extractEvidence(pdfText, documentName);
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
      const evidenceRecall = await recallMemory(caseId, 'all evidence items [EVIDENCE]');
      allEvidenceData = evidenceRecall?.memories || evidenceRecall?.results || [];
    } catch (err) {
      console.warn('   Could not recall evidence, using new evidence only:', err.message);
      allEvidenceData = newEvidence;
    }

    // Recall existing timeline
    let existingTimeline = [];
    try {
      const timelineRecall = await recallMemory(caseId, 'complete timeline [TIMELINE]');
      existingTimeline = timelineRecall?.memories || timelineRecall?.results || [];
    } catch (err) {
      console.warn('   No existing timeline found:', err.message);
    }

    const updatedTimeline = await updateTimeline(
      allEvidenceData.length > 0 ? allEvidenceData : newEvidence,
      existingTimeline
    );
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
      const invRecall = await recallMemory(caseId, 'investigation findings [INVESTIGATION]');
      priorInvestigations = invRecall?.memories || invRecall?.results || [];
    } catch (err) {
      console.warn('   No prior investigations found:', err.message);
    }

    const investigationFindings = await analyzeCase(
      allEvidenceData.length > 0 ? allEvidenceData : newEvidence,
      updatedTimeline,
      priorInvestigations
    );
    console.log(`   Generated ${investigationFindings.length} investigation findings`);

    // Store investigation results in Hindsight
    if (investigationFindings.length > 0) {
      await retainInvestigationList(caseId, investigationFindings);
    }

    // Mark document as completed
    await query(
      'UPDATE documents SET processing_status = $1 WHERE id = $2',
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

    // Mark document as failed
    await query(
      'UPDATE documents SET processing_status = $1 WHERE id = $2',
      ['failed', documentId]
    ).catch(() => {}); // don't let status update failure mask the real error

    throw error;
  }
};
