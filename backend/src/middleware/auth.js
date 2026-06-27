import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

/**
 * Express middleware to verify JWT tokens and database-backed sessions.
 * Checks cookies first, then falls back to Authorization Bearer header.
 * Automatically renews the short-lived access token if the session is still valid in the database.
 * Sets req.user = { id, email, sessionToken }
 */
export const authenticate = async (req, res, next) => {
  let accessToken = null;
  let sessionToken = null;

  // 1. Try to read from cookies
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    accessToken = cookies.juristrail_access_token;
    sessionToken = cookies.juristrail_session_token;
  }

  // 2. Try to read from Authorization header as fallback for access token
  if (!accessToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    accessToken = req.headers.authorization.split(' ')[1];
  }

  if (!accessToken && !sessionToken) {
    return res.status(401).json({ error: 'Access denied. No session or access token provided.' });
  }

  // 1. Try validating the access token first
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      
      // Verify session in database
      const sessionResult = await query(
        `SELECT us.id, us.user_id, u.email 
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         WHERE us.token = $1 AND us.is_active = TRUE AND us.expires_at > NOW()`,
        [decoded.sessionToken]
      );

      if (sessionResult.rows.length > 0) {
        req.user = {
          id: sessionResult.rows[0].user_id,
          email: sessionResult.rows[0].email,
          sessionToken: decoded.sessionToken
        };
        return next();
      }
    } catch (err) {
      // If the access token is invalid for any reason other than expiration, reject.
      // If it is expired, we fall through to try verifying/refreshing with the session token.
      if (err.name !== 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid token.' });
      }
    }
  }

  // 2. If access token is expired or missing, check the session token
  if (sessionToken) {
    try {
      const sessionResult = await query(
        `SELECT us.id, us.user_id, u.email 
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         WHERE us.token = $1 AND us.is_active = TRUE AND us.expires_at > NOW()`,
        [sessionToken]
      );

      if (sessionResult.rows.length > 0) {
        const user = {
          id: sessionResult.rows[0].user_id,
          email: sessionResult.rows[0].email
        };

        // Generate a new access token JWT (expires in 15 minutes)
        const newAccessToken = generateToken(user, sessionToken);

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('juristrail_access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        req.user = {
          id: user.id,
          email: user.email,
          sessionToken
        };
        return next();
      }
    } catch (dbErr) {
      console.error('Session token verification db error:', dbErr.message);
    }
  }

  return res.status(401).json({ error: 'Session expired. Please log in again.' });
};

/**
 * Generate a JWT for a user.
 */
export const generateToken = (user, sessionToken) => {
  return jwt.sign(
    { id: user.id, email: user.email, sessionToken },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );
};


