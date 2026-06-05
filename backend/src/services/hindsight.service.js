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
 * Helper to parse recalled Hindsight memories with a specific prefix.
 */
const parseMemories = (recalled, prefix) => {
  const memories = recalled?.memories || recalled?.results || [];
  const list = [];
  for (const mem of memories) {
    const content = typeof mem === 'string' ? mem : (mem?.content || '');
    if (content && content.startsWith(prefix)) {
      try {
        const parsed = JSON.parse(content.substring(prefix.length));
        list.push({
          id: mem.id || parsed.id,
          ...parsed
        });
      } catch (e) {
        console.warn(`Failed to parse memory contents for prefix ${prefix}:`, e.message);
      }
    } else if (content) {
      // Fallback: try parsing the whole string if it's JSON
      try {
        const parsed = JSON.parse(content);
        list.push({
          id: mem.id || parsed.id,
          ...parsed
        });
      } catch (e) {
        // Not JSON
      }
    }
  }
  return list;
};

/**
 * Recall and parse all evidence items for a case.
 */
export const recallEvidenceList = async (caseId) => {
  const recalled = await recallMemory(caseId, '[EVIDENCE]', { budget: 'high' });
  return parseMemories(recalled, '[EVIDENCE] ');
};

/**
 * Recall and parse all timeline entries for a case.
 */
export const recallTimelineList = async (caseId) => {
  const recalled = await recallMemory(caseId, '[TIMELINE]', { budget: 'high' });
  return parseMemories(recalled, '[TIMELINE] ');
};

/**
 * Recall and parse all investigation findings for a case.
 */
export const recallInvestigationList = async (caseId) => {
  const recalled = await recallMemory(caseId, '[INVESTIGATION]', { budget: 'high' });
  return parseMemories(recalled, '[INVESTIGATION] ');
};
