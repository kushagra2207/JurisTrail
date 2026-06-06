import { extractEvidence } from '../agents/evidence.agent.js';
import { updateTimeline } from '../agents/timeline.agent.js';
import { analyzeCase } from '../agents/investigation.agent.js';
import {
  retainEvidenceList,
  retainTimelineList,
  retainInvestigationList,
} from './hindsight.service.js';
import { query } from '../config/db.js';

/**
 * Run the full 3-agent pipeline for a newly uploaded document.
 *
 * Flow:
 * 1. Evidence Agent: extract structured evidence from PDF text → save to documents.extracted_data + Hindsight
 * 2. Timeline Agent: gather ALL evidence (from PostgreSQL), generate timeline → save to cases.case_timeline + Hindsight
 * 3. Investigation Agent: analyze ALL evidence + timeline → save to cases.case_investigations + Hindsight
 *
 * PostgreSQL = source of truth for structured UI display (FactBox, Timeline, Insights)
 * Hindsight = semantic memory for chat recall & reflect
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

    console.log(`[Pipeline] Starting for doc "${documentName}" in case ${caseId}`);

    // ──────────────────────────────────────────────
    // STEP 1: Evidence Agent
    // ──────────────────────────────────────────────
    console.log('[Pipeline] Step 1: Extracting evidence...');
    let newEvidence;
    try {
      newEvidence = await extractEvidence(pdfText, documentName);
    } catch (err) {
      throw new Error(`Evidence Agent failed: ${err.message}`);
    }
    console.log(`   Found ${newEvidence.length} evidence items`);

    // Persist extracted evidence to PostgreSQL (for FactBox display)
    await query(
      'UPDATE documents SET extracted_data = $1 WHERE id = $2',
      [JSON.stringify({ evidence: newEvidence }), documentId]
    );

    // Also retain in Hindsight (for chat recall/reflect)
    if (newEvidence.length > 0) {
      await retainEvidenceList(caseId, newEvidence);
    }

    // ──────────────────────────────────────────────
    // STEP 2: Timeline Agent
    // ──────────────────────────────────────────────
    console.log('[Pipeline] Step 2: Updating timeline...');

    // Gather ALL evidence across ALL case documents from PostgreSQL
    const allDocsResult = await query(
      `SELECT extracted_data FROM documents
       WHERE case_id = $1 AND (processing_status = 'completed' OR id = $2)`,
      [caseId, documentId]
    );
    let allEvidence = allDocsResult.rows.flatMap(r => {
      const data = typeof r.extracted_data === 'string'
        ? JSON.parse(r.extracted_data)
        : (r.extracted_data || {});
      return data.evidence || [];
    });
    // Ensure newly extracted evidence is included (may not be in DB yet for current doc)
    const existingIds = new Set(allEvidence.map(e => e.id));
    for (const ne of newEvidence) {
      if (!existingIds.has(ne.id)) {
        allEvidence.push(ne);
      }
    }

    console.log(`   Total evidence across all documents: ${allEvidence.length}`);

    // Read existing timeline from case record (PostgreSQL)
    const caseRecord = await query(
      'SELECT case_timeline, case_investigations FROM cases WHERE id = $1',
      [caseId]
    );
    const existingTimeline = caseRecord.rows[0]?.case_timeline || [];

    let updatedTimeline;
    try {
      // Create a simplified version of allEvidence for the timeline agent to save tokens
      const simplifiedEvidenceForTimeline = allEvidence.map(e => ({
        id: e.id,
        type: e.type,
        content: e.content,
        dates: e.dates || [],
        source_document: e.source_document
      }));
      updatedTimeline = await updateTimeline(simplifiedEvidenceForTimeline, existingTimeline);
    } catch (err) {
      throw new Error(`Timeline Agent failed: ${err.message}`);
    }
    console.log(`   Generated ${updatedTimeline.length} timeline entries`);

    // Save timeline to PostgreSQL (replaces previous timeline)
    await query(
      'UPDATE cases SET case_timeline = $1 WHERE id = $2',
      [JSON.stringify(updatedTimeline), caseId]
    );

    // Also retain in Hindsight (for chat recall/reflect)
    if (updatedTimeline.length > 0) {
      await retainTimelineList(caseId, updatedTimeline);
    }

    // ──────────────────────────────────────────────
    // STEP 3: Investigation Agent
    // ──────────────────────────────────────────────
    console.log('[Pipeline] Step 3: Running investigation analysis...');

    // Read prior investigations from case record (PostgreSQL)
    const priorInvestigations = caseRecord.rows[0]?.case_investigations || [];

    let investigationFindings;
    try {
      // Create highly compacted versions of all inputs to save tokens
      const simplifiedEvidenceForAnalysis = allEvidence.map(e => {
        const clean = {
          id: e.id,
          type: e.type,
          content: e.content,
          source_document: e.source_document
        };
        if (e.dates && e.dates.length > 0) clean.dates = e.dates;
        if (e.entities && e.entities.length > 0) {
          clean.entities = e.entities.map(ent => ({ name: ent.name, type: ent.type, desc: ent.desc }));
        }
        if (e.locations && e.locations.length > 0) clean.locations = e.locations;
        if (e.relationships && e.relationships.length > 0) clean.relationships = e.relationships;
        if (e.key_claims && e.key_claims.length > 0) clean.key_claims = e.key_claims;
        return clean;
      });

      const simplifiedTimeline = updatedTimeline.map(t => ({
        timestamp: t.timestamp,
        description: t.description,
        sourceDoc: t.sourceDoc,
        status: t.status
      }));

      const simplifiedPrior = priorInvestigations.map(p => ({
        type: p.type,
        status: p.status,
        title: p.title,
        summary: p.summary,
        details: p.details,
        evidenceA: p.evidenceA,
        evidenceB: p.evidenceB
      }));

      investigationFindings = await analyzeCase(
        simplifiedEvidenceForAnalysis,
        simplifiedTimeline,
        simplifiedPrior
      );
    } catch (err) {
      throw new Error(`Investigation Agent failed: ${err.message}`);
    }
    console.log(`   Generated ${investigationFindings.length} investigation findings`);

    // Save investigations to PostgreSQL (replaces previous investigations)
    const contradictionsCount = investigationFindings.filter(f => f.type === 'contradiction').length;
    await query(
      'UPDATE cases SET case_investigations = $1, contradictions_count = $2, updated_at = NOW() WHERE id = $3',
      [JSON.stringify(investigationFindings), contradictionsCount, caseId]
    );

    // Also retain in Hindsight (for chat recall/reflect)
    if (investigationFindings.length > 0) {
      await retainInvestigationList(caseId, investigationFindings);
    }

    // Mark document as completed
    await query(
      "UPDATE documents SET processing_status = $1 WHERE id = $2",
      ['completed', documentId]
    );

    console.log(`[Pipeline] Completed for doc "${documentName}"`);

    return {
      evidence: newEvidence,
      timeline: updatedTimeline,
      investigations: investigationFindings,
    };
  } catch (error) {
    console.error(`[Pipeline] Failed for doc "${documentName}":`, error.message);

    // Mark document as failed and store the error message
    await query(
      "UPDATE documents SET processing_status = $1, processing_error = $2 WHERE id = $3",
      ['failed', error.message || 'Unknown pipeline error', documentId]
    ).catch(() => {}); // don't let status update failure mask the real error

    throw error;
  }
};
