import { query } from '../config/db.js';
import { formatRelativeTime } from '../utils/helpers.js';
import { deleteCaseBank } from '../services/hindsight.service.js';

const mapCaseResponse = (row) => ({
  id: row.id,
  title: row.title,
  docket: row.docket || '',
  court: row.court || '',
  desc: row.description || '',
  status: row.status,
  documentsCount: parseInt(row.documentsCount || row.document_count || 0, 10),
  contradictionsCount: parseInt(row.contradictionsCount || row.contradictions_count || 0, 10),
  lastUpdated: formatRelativeTime(row.updated_at),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

/**
 * GET /api/cases
 * List all cases for the authenticated user.
 */
export const listCases = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.title, c.docket, c.court, c.description, c.status, c.created_at, c.updated_at,
              c.contradictions_count AS "contradictionsCount",
              (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) AS "documentsCount"
       FROM cases c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );

    const mapped = result.rows.map(mapCaseResponse);
    return res.json(mapped);
  } catch (error) {
    console.error('List cases error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/cases
 * Create a new case.
 */
export const createCase = async (req, res) => {
  try {
    const { title, docket, court, desc } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Case title is required.' });
    }

    const result = await query(
      `INSERT INTO cases (user_id, title, docket, court, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, docket, court, description, status, contradictions_count, created_at, updated_at`,
      [req.user.id, title, docket || null, court || null, desc || null]
    );

    const newCase = mapCaseResponse({
      ...result.rows[0],
      document_count: 0
    });

    return res.status(201).json(newCase);
  } catch (error) {
    console.error('Create case error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/cases/:id
 * Get a specific case with its details.
 */
export const getCase = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.id, c.title, c.docket, c.court, c.description, c.status, c.created_at, c.updated_at,
              c.contradictions_count AS "contradictionsCount",
              (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) AS "documentsCount"
       FROM cases c
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    return res.json(mapCaseResponse(result.rows[0]));
  } catch (error) {
    console.error('Get case error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * PUT /api/cases/:id
 * Update a case's title, description, or status.
 */
export const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, docket, court, desc, status } = req.body;

    // Verify ownership
    const existing = await query(
      'SELECT id FROM cases WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const result = await query(
      `UPDATE cases
       SET title = COALESCE($1, title),
           docket = COALESCE($2, docket),
           court = COALESCE($3, court),
           description = COALESCE($4, description),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, title, docket, court, description, status, contradictions_count, created_at, updated_at`,
      [title, docket, court, desc, status, id]
    );

    const updated = mapCaseResponse(result.rows[0]);

    return res.json(updated);
  } catch (error) {
    console.error('Update case error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/cases/:id
 * Delete a case and all associated data.
 */
export const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM cases WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Safely delete corresponding bank on Hindsight
    try {
      await deleteCaseBank(id);
    } catch (err) {
      console.warn(`Could not delete Hindsight bank for case ${id}:`, err.message);
    }

    return res.json({ message: 'Case deleted successfully.' });
  } catch (error) {
    console.error('Delete case error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
