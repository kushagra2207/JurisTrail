import { recallMemory, reflectMemory } from '../services/hindsight.service.js';
import { chatCompletion } from '../services/llm.service.js';
import { query } from '../config/db.js';

/**
 * POST /api/cases/:caseId/chat
 * Ask a question about the case. Uses Hindsight recall + reflect, then LLM for final answer.
 */
export const chat = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id, title FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const caseTitle = caseCheck.rows[0].title;

    // Recall relevant memories from Hindsight
    let recalledContext = '';
    try {
      const recalled = await recallMemory(caseId, message);
      recalledContext = JSON.stringify(recalled?.memories || recalled?.results || recalled, null, 2);
    } catch (err) {
      console.warn('Recall failed, proceeding without context:', err.message);
    }

    // Reflect for deeper insights if the question is analytical
    let reflectionContext = '';
    try {
      const reflected = await reflectMemory(caseId, message);
      reflectionContext = JSON.stringify(reflected?.reflection || reflected?.result || reflected, null, 2);
    } catch (err) {
      console.warn('Reflect failed, proceeding without reflection:', err.message);
    }

    // Build prompt for final answer
    const systemPrompt = `You are JurisTrail, an AI legal investigation assistant. You are helping a lawyer analyze case "${caseTitle}".

You have access to the following case memories and analysis. Use them to provide thorough, well-reasoned answers.
When referencing evidence, mention the source document name and evidence ID.
When referencing timeline events, mention the date and timeline ID.
When referencing investigations, mention the finding type and investigation ID.

Be precise, cite your sources from the case data, and highlight any uncertainties or contradictions you notice.

=== RECALLED MEMORIES ===
${recalledContext || '(No memories recalled for this query)'}

=== REFLECTION / ANALYSIS ===
${reflectionContext || '(No reflection available)'}`;

    const answer = await chatCompletion(systemPrompt, message, { maxTokens: 4096 });

    return res.json({
      response: answer,
      answer,
      metadata: {
        hasRecalledContext: !!recalledContext,
        hasReflection: !!reflectionContext,
      },
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/cases/:caseId/evidence
 * Retrieve all evidence from Hindsight memory.
 */
export const getEvidence = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Verify case ownership
    const caseCheck = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    let evidence = [];
    try {
      evidence = await recallEvidenceList(caseId);
    } catch (err) {
      console.warn('Evidence recall failed:', err.message);
    }

    return res.json(evidence);
  } catch (error) {
    console.error('Get evidence error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/cases/:caseId/timeline
 * Retrieve the case timeline from Hindsight memory.
 */
export const getTimeline = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Verify case ownership and fetch timeline from PostgreSQL
    const caseResult = await query(
      'SELECT id, case_timeline FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const timeline = caseResult.rows[0].case_timeline || [];
    return res.json({ data: timeline, error: null });
  } catch (error) {
    console.error('Get timeline error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/cases/:caseId/investigations
 * Retrieve investigation findings from Hindsight memory.
 */
export const getInvestigations = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Verify case ownership and fetch investigations from PostgreSQL
    const caseResult = await query(
      'SELECT id, case_investigations FROM cases WHERE id = $1 AND user_id = $2',
      [caseId, req.user.id]
    );
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const investigations = caseResult.rows[0].case_investigations || [];
    return res.json({ data: investigations, error: null });
  } catch (error) {
    console.error('Get investigations error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
