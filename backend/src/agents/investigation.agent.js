import { chatCompletionJSON } from '../services/llm.service.js';
import { safeParseJSON, generateId } from '../utils/helpers.js';

const SYSTEM_PROMPT = `You are the Investigation Agent for a legal case investigation system. Your job is to analyze all accumulated evidence, the timeline, and prior investigations to find patterns, contradictions, and investigative leads.

You receive:
1. ALL evidence collected so far (from all documents in the case)
2. The current TIMELINE of events
3. PRIOR investigation findings (may be empty on first run)

Your analysis tasks:
- **Contradictions**: Identify where evidence items or timeline entries conflict with each other. E.g., witness says X was at location A at 9PM, but GPS shows X at location B at the same time.
- **Corroborations**: Identify where multiple pieces of evidence support the same claim, strengthening it.
- **Gaps**: Identify missing information — what questions remain unanswered? What evidence would be needed to clarify?
- **Patterns**: Identify emerging patterns across the evidence (e.g., recurring contacts, financial flows, behavioral patterns).
- **Leads**: Suggest investigative leads — what should be looked into next?

For each finding, include:
- type: "contradiction" | "corroboration" | "gap" | "pattern" | "lead"
- status: "open" | "resolved"
- title: Short, professional title of the finding (e.g., "John's Location Timeline Discrepancy")
- summary: A one-sentence summary of the conflict or discovery (e.g., "Conflict between physical witness testimony and electronic vehicle telemetry.")
- details: A thorough, step-by-step detailed analysis explaining the discrepancy or findings.
- evidenceA: Object containing:
  - source: Name of the first source document (e.g. "Witness_Statement_Raman.txt")
  - text: The relevant assertion text or quote from the first source
- evidenceB: Object containing:
  - source: Name of the second source document (or empty if not applicable)
  - text: The relevant assertion text or quote from the second source (or empty if not applicable)

IMPORTANT: Your response must be the COMPLETE, FULL set of all investigation findings for this case.
- INCLUDE all prior findings that are still valid and relevant (you may update their status or details if new evidence changes them).
- ADD any new findings discovered from new evidence.
- REMOVE only findings that are no longer valid or have been conclusively resolved by new evidence.
- The output replaces the entire investigation record, so do NOT omit prior findings unless they are truly obsolete.

Respond with a JSON object:
{
  "investigations": [
    {
      "type": "contradiction",
      "status": "open",
      "title": "...",
      "summary": "...",
      "details": "...",
      "evidenceA": {
        "source": "Witness_Statement_Raman.txt",
        "text": "..."
      },
      "evidenceB": {
        "source": "John_GPS_Tracker_Log.json",
        "text": "..."
      }
    }
  ]
}`;

/**
 * Analyze case data to find contradictions, patterns, and leads.
 * @param {Array} allEvidence - All evidence items
 * @param {Array} timeline - Current timeline
 * @param {Array} priorInvestigations - Previous investigation findings
 * @returns {Promise<Array>} New investigation findings
 */
export const analyzeCase = async (allEvidence, timeline, priorInvestigations) => {
  const userPrompt = `=== ALL EVIDENCE ===
${JSON.stringify(allEvidence, null, 2)}

=== CURRENT TIMELINE ===
${JSON.stringify(timeline, null, 2)}

=== PRIOR INVESTIGATION FINDINGS ===
${priorInvestigations.length > 0 ? JSON.stringify(priorInvestigations, null, 2) : '(No prior investigations — this is the first analysis)'}

Analyze the above data thoroughly. Identify contradictions, corroborations, gaps, patterns, and leads.`;

  const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt, { maxTokens: 3000 });
  const parsed = safeParseJSON(responseText);

  // Add IDs to investigation items
  const investigationItems = (parsed.investigations || []).map((item) => ({
    id: item.id || generateId('inv'),
    ...item,
  }));

  return investigationItems;
};
