import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the Bearer token, looks up the user in the database,
 * and attaches `req.user = { user_id }`. Returns 401 JSON on failure.
 */
export const checkJwtMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // Ensure that user exists
    const user = await db.oneOrNone(
      'SELECT user_id, role FROM user_profiles WHERE user_id = $1',
      [payload.userId]
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Attach full user object (including role)
    req.user = {
      user_id: user.user_id,
      role: user.role
    };
    next();
  } catch (err) {
    console.error('checkJwtMiddleware Error:', err.name, err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: `Unauthorized: Invalid token - ${err.message}` });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized (Middleware failure)' });
  }
};

/**
 * Factory to enforce a specific user role.
 * Usage: router.get('/admin', checkJwtMiddleware, requireRole('admin'), handler)
 */
export function requireRole(requiredRole) {
  return async (req, res, next) => {
    if (!req.user?.user_id) {
      return res.status(401).json({ error: 'Unauthorized. No user info found.' });
    }

    // req.user.role was attached in checkJwtMiddleware
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: `Forbidden. Requires role: ${requiredRole}` });
    }

    next();
  };
}
