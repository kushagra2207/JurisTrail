import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

/**
 * POST /api/auth/signup
 * Register a new user.
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, firmName } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, firm_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, firm_name, created_at`,
      [name, email.toLowerCase(), passwordHash, firmName || null]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        firmName: user.firm_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user and return JWT.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await query(
      'SELECT id, name, email, password_hash, firm_name, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        firmName: user.firm_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile.
 */
export const getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, firm_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        firmName: user.firm_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
