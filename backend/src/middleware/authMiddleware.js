/**
 * backend/src/middleware/authMiddleware.js
 *
 * Middleware to verify JWTs and enforce roles (user, community_admin, super_admin).
 */

const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * checkJwtMiddleware:
 *  - Reads the Bearer token from Authorization header.
 *  - Verifies the token using JWT_SECRET.
 *  - Fetches user from Supabase to confirm existence.
 *  - Attaches userId & role to req object.
 */
async function checkJwtMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // Validate user still exists in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    req.userId = user.id;
    req.role = user.role;
    next();
  } catch (err) {
    console.error('checkJwtMiddleware Error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * requireRole(requiredRole):
 *  - Returns middleware that checks if req.role matches requiredRole.
 *  - Also allows 'super_admin' to bypass.
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    const userRole = req.role;
    if (userRole === requiredRole || userRole === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
    }
  };
}

module.exports = { checkJwtMiddleware, requireRole };
