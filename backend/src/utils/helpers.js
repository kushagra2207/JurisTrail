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

/**
 * Format bytes into readable string (e.g. 1.2 MB)
 */
export const formatBytes = (bytes, decimals = 1) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 KB';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format timestamp into relative display string (e.g. 2 hours ago)
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'Unknown';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
