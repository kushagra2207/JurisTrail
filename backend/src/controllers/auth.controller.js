import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

/**
 * POST /api/auth/signup
 * Register a new user.
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, enrollmentNumber } = req.body;

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
      `INSERT INTO users (name, email, password_hash, enrollment_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, enrollment_number, created_at`,
      [name, email.toLowerCase(), passwordHash, enrollmentNumber || null]
    );

    const user = result.rows[0];

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, sessionToken, expiresAt]
    );

    // Generate JWT containing sessionToken reference
    const token = generateToken(user, sessionToken);

    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('juristrail_access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('juristrail_session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        barId: user.enrollment_number,
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
      'SELECT id, name, email, password_hash, enrollment_number, created_at FROM users WHERE email = $1',
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

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, sessionToken, expiresAt]
    );

    // Generate JWT containing sessionToken reference
    const token = generateToken(user, sessionToken);

    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('juristrail_access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('juristrail_session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        barId: user.enrollment_number,
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
      'SELECT id, name, email, enrollment_number, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    return res.json({
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        barId: user.enrollment_number,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/logout
 * Deactivate user session in DB and clear cookie.
 */
export const logout = async (req, res) => {
  try {
    const sessionToken = req.user?.sessionToken;
    if (sessionToken) {
      await query(
        'UPDATE user_sessions SET is_active = FALSE WHERE token = $1',
        [sessionToken]
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('juristrail_access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    res.clearCookie('juristrail_session_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
