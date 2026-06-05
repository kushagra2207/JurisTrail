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
