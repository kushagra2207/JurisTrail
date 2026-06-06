import hindsightClient from '../config/hindsight.js';
import { getCaseBankId } from '../utils/helpers.js';

/**
 * Store a memory entry in a case's Hindsight bank.
 * @param {string} caseId
 * @param {string} content - Prefixed content string, e.g. "[EVIDENCE] {...}"
 */
export const retainMemory = async (caseId, content) => {
  const bankId = getCaseBankId(caseId);
  return hindsightClient.retain(bankId, content);
};

/**
 * Recall memories from a case bank by query.
 * @param {string} caseId
 * @param {string} queryText
 * @param {object} options
 * @returns {Promise<object>}
 */
export const recallMemory = async (caseId, queryText, options = {}) => {
  const bankId = getCaseBankId(caseId);
  return hindsightClient.recall(bankId, queryText, options);
};

/**
 * Reflect on a case's memories — synthesized reasoning.
 * @param {string} caseId
 * @param {string} queryText
 * @param {object} options
 * @returns {Promise<object>}
 */
export const reflectMemory = async (caseId, queryText, options = {}) => {
  const bankId = getCaseBankId(caseId);
  return hindsightClient.reflect(bankId, queryText, options);
};

/**
 * Store multiple evidence items in memory.
 * Each evidence is stored as a separate retain call with [EVIDENCE] prefix.
 */
export const retainEvidenceList = async (caseId, evidenceItems) => {
  const results = [];
  for (const item of evidenceItems) {
    const content = `[EVIDENCE] ${JSON.stringify(item)}`;
    const result = await retainMemory(caseId, content);
    results.push(result);
  }
  return results;
};

/**
 * Store timeline entries in memory.
 */
export const retainTimelineList = async (caseId, timelineItems) => {
  const results = [];
  for (const item of timelineItems) {
    const content = `[TIMELINE] ${JSON.stringify(item)}`;
    const result = await retainMemory(caseId, content);
    results.push(result);
  }
  return results;
};

/**
 * Store investigation findings in memory.
 */
export const retainInvestigationList = async (caseId, investigationItems) => {
  const results = [];
  for (const item of investigationItems) {
    const content = `[INVESTIGATION] ${JSON.stringify(item)}`;
    const result = await retainMemory(caseId, content);
    results.push(result);
  }
  return results;
};

/**
 * Extract the raw results array from a Hindsight recall response.
 * Hindsight returns `results` (not `memories`) as the top-level key.
 */
const extractResults = (recalled) => {
  return recalled?.results || recalled?.memories || [];
};

/**
 * Recall and return all evidence-related memories for a case.
 * Hindsight is a semantic memory engine — it doesn't store raw strings verbatim.
 * The recalled memories have their own structure (id, text, type, entities, etc.),
 * which we map to the shape the frontend expects.
 */
export const recallEvidenceList = async (caseId) => {
  const recalled = await recallMemory(caseId, 'evidence facts claims witness statements', { budget: 'high' });
  const results = extractResults(recalled);
  return results.map(mem => ({
    id: mem.id,
    type: mem.type || 'evidence',
    content: mem.text || '',
    entities: (mem.entities || []).map(name => ({ name, type: 'other', desc: '' })),
    source_document: mem.document_id || '',
    locations: [],
    dates: [mem.occurred_start, mem.occurred_end].filter(Boolean),
    relationships: [],
    key_claims: [mem.text].filter(Boolean),
  }));
};

/**
 * Recall and return all timeline entries for a case.
 * Maps Hindsight's semantic memory format to the shape CaseTimeline.jsx expects:
 *   { id, timestamp, displayTime, precision, title, description, status, sourceDoc }
 */
export const recallTimelineList = async (caseId) => {
  const recalled = await recallMemory(caseId, 'timeline chronological events dates when occurred', { budget: 'high' });
  const results = extractResults(recalled);
  return results.map(mem => {
    const text = mem.text || '';
    // Use occurred_start as timestamp if available
    const timestamp = mem.occurred_start || mem.mentioned_at || null;
    let displayTime = 'Unknown Date';
    if (timestamp) {
      try {
        displayTime = new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        });
      } catch { /* keep Unknown Date */ }
    }

    return {
      id: mem.id,
      timestamp,
      displayTime,
      precision: mem.occurred_start ? 'Approximate' : 'Rough Estimate',
      title: text.length > 80 ? text.substring(0, 80) + '…' : text,
      description: text,
      status: 'normal',
      sourceDoc: mem.document_id || '',
    };
  });
};

/**
 * Recall and return all investigation findings for a case.
 * Maps Hindsight's semantic memory format to the shape ConflictsInsights.jsx expects:
 *   { id, type, status, title, summary, details, evidenceA: {source, text}, evidenceB: {source, text} }
 */
export const recallInvestigationList = async (caseId) => {
  const recalled = await recallMemory(caseId, 'investigation contradiction corroboration gap pattern lead analysis', { budget: 'high' });
  const results = extractResults(recalled);
  return results.map(mem => {
    const text = mem.text || '';
    return {
      id: mem.id,
      type: mem.type || 'pattern',
      status: 'open',
      title: text.length > 80 ? text.substring(0, 80) + '…' : text,
      summary: text,
      details: mem.context || text,
      evidenceA: {
        source: mem.document_id || 'Hindsight Memory',
        text: text,
      },
      evidenceB: {
        source: '',
        text: '',
      },
    };
  });
};

/**
 * Delete a case's Hindsight bank completely.
 */
export const deleteCaseBank = async (caseId) => {
  const bankId = getCaseBankId(caseId);
  return hindsightClient.deleteBank(bankId);
};
