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

For each timeline entry, include:
- timestamp: Best estimate of when the event occurred in ISO 8601 format (e.g. "2026-04-04T20:55:00Z")
- displayTime: A beautifully formatted date and time for display (e.g. "April 4, 2026 — 8:55 PM")
- precision: Level of precision ("Exact" | "Approximate" | "Exact GPS" | "Rough Estimate")
- description: Clear, concise description of what occurred during the event
- sourceDoc: The name of the source document where this event was discovered (e.g. "Witness_Statement_Raman.txt")
- status: Support/conflict status indicator ("normal" | "support" | "conflict"). Mark as "conflict" if there's contradictory evidence for this timestamp/event.

Respond with a JSON object:
{
  "timeline": [
    {
      "timestamp": "2026-04-04T20:55:00Z",
      "displayTime": "April 4, 2026 — 8:55 PM",
      "precision": "Exact",
      "description": "John Sharma's mobile phone registers a cellular connection at Sector-12 Mast (Colaba)...",
      "sourceDoc": "Phone_Location_Records.csv",
      "status": "support"
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

  const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt, { maxTokens: 2048 });
  const parsed = safeParseJSON(responseText);

  // Add IDs to new timeline entries
  const timelineItems = (parsed.timeline || []).map((item) => ({
    id: item.id || generateId('tl'),
    ...item,
  }));

  return timelineItems;
};
