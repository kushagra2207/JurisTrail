import { chatCompletionJSON } from '../services/llm.service.js';
import { safeParseJSON, generateId } from '../utils/helpers.js';

const SYSTEM_PROMPT = `You are the Investigation Agent for a legal case investigation system. Your job is to analyze all accumulated evidence, the timeline, and prior investigations to find patterns, contradictions, and investigative leads.

You receive:
1. ALL evidence collected so far
2. The current TIMELINE of events
3. PRIOR investigation findings (may be empty on first run)

Your analysis tasks:
- **Contradictions**: Identify where evidence items or timeline entries conflict with each other. E.g., witness says X was at location A at 9PM, but GPS shows X at location B at the same time.
- **Corroborations**: Identify where multiple pieces of evidence support the same claim, strengthening it.
- **Gaps**: Identify missing information — what questions remain unanswered? What evidence would be needed to clarify?
- **Patterns**: Identify emerging patterns across the evidence (e.g., recurring contacts, financial flows, behavioral patterns).
- **Leads**: Suggest investigative leads — what should be looked into next?

For each finding:
- type: "contradiction" | "corroboration" | "gap" | "pattern" | "lead"
- finding: Clear description of the finding
- certainty: 0.0 to 1.0 (how confident are you in this finding)
- evidence_ids: Array of evidence IDs that led to this finding
- timeline_ids: Array of timeline entry IDs relevant to this finding
- priority: "high" | "medium" | "low"
- recommendation: What action should be taken based on this finding

Do NOT repeat findings that were already in the prior investigations unless new evidence changes them significantly.

Respond with a JSON object:
{
  "investigations": [
    {
      "type": "contradiction",
      "finding": "...",
      "certainty": 0.85,
      "evidence_ids": ["ev-abc123", "ev-def456"],
      "timeline_ids": ["tl-aaa111"],
      "priority": "high",
      "recommendation": "..."
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

  const responseText = await chatCompletionJSON(SYSTEM_PROMPT, userPrompt, { maxTokens: 8192 });
  const parsed = safeParseJSON(responseText);

  // Add IDs to investigation items
  const investigationItems = (parsed.investigations || []).map((item) => ({
    id: item.id || generateId('inv'),
    ...item,
  }));

  return investigationItems;
};
