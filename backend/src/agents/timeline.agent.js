import { chatCompletionJSON } from '../services/llm.service.js';
import { safeParseJSON, generateId } from '../utils/helpers.js';

const SYSTEM_PROMPT = `You are the Timeline Agent for a legal case investigation system. Your job is to build and maintain a chronological timeline of events based on accumulated evidence.

You receive:
1. ALL evidence collected so far (both old and new)
2. The EXISTING timeline (may be empty for the first run)

Your tasks:
- Create new timeline entries for events found in the evidence
- Update existing timeline entries if new evidence provides more detail or changes confidence
- Merge duplicate events that refer to the same occurrence
- Order everything chronologically
- Mark the confidence level for each event (high, medium, low) based on how well-supported it is

For each timeline entry, include:
- datetime: Best estimate of when the event occurred (ISO format if possible, or descriptive like "early March 2025")
- event: Clear description of what happened
- evidence_ids: Array of evidence IDs that support this timeline entry
- confidence: "high" | "medium" | "low"
- notes: Any relevant notes about uncertainty or conflicting information

Respond with a JSON object:
{
  "timeline": [
    {
      "datetime": "2025-03-15T21:00:00",
      "event": "...",
      "evidence_ids": ["ev-abc123"],
      "confidence": "high",
      "notes": ""
    }
  ]
}`;

/**
 * Generate/update the case timeline from evidence.
 * @param {Array} allEvidence - All evidence items for this case
 * @param {Array} existingTimeline - Current timeline entries (may be empty)
 * @returns {Promise<Array>} Updated timeline entries with generated IDs
 */
export const updateTimeline = async (allEvidence, existingTimeline) => {
  const userPrompt = `=== ALL EVIDENCE ===
${JSON.stringify(allEvidence, null, 2)}

=== EXISTING TIMELINE ===
${existingTimeline.length > 0 ? JSON.stringify(existingTimeline, null, 2) : '(No existing timeline yet — this is the first run)'}

Based on all the evidence above, generate the complete updated timeline. Include all events, ordered chronologically.`;

  const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt);
  const parsed = safeParseJSON(responseText);

  // Add IDs to new timeline entries
  const timelineItems = (parsed.timeline || []).map((item) => ({
    id: item.id || generateId('tl'),
    ...item,
  }));

  return timelineItems;
};
