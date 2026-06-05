import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a prefixed UUID.
 * @param {string} prefix - e.g. 'ev', 'tl', 'inv'
 * @returns {string} e.g. 'ev-a1b2c3d4'
 */
export const generateId = (prefix = '') => {
  const id = uuidv4().split('-')[0]; // short 8-char segment
  return prefix ? `${prefix}-${id}` : id;
};

/**
 * Build the Hindsight bank ID for a case.
 * @param {string} caseId
 * @returns {string}
 */
export const getCaseBankId = (caseId) => `case-${caseId}`;

/**
 * Safely parse JSON from LLM output, stripping markdown code fences if present.
 * @param {string} text
 * @returns {any}
 */
export const safeParseJSON = (text) => {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
};
