import { query } from '../config/db.js';

/**
 * GET /api/cases
 * List all cases for the authenticated user.
 */
export const listCases = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.title, c.description, c.status, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) AS document_count
       FROM cases c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );

    return res.json({ cases: result.rows });
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
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Case title is required.' });
    }

    const result = await query(
      `INSERT INTO cases (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, status, created_at, updated_at`,
      [req.user.id, title, description || null]
    );

    return res.status(201).json({ case: result.rows[0] });
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
      `SELECT c.id, c.title, c.description, c.status, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) AS document_count
       FROM cases c
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    return res.json({ case: result.rows[0] });
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
    const { title, description, status } = req.body;

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
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, description, status, created_at, updated_at`,
      [title, description, status, id]
    );

    return res.json({ case: result.rows[0] });
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

    return res.json({ message: 'Case deleted successfully.' });
  } catch (error) {
    console.error('Delete case error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
