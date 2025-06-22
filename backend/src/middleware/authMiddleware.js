// tempo/backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Use the new raw SQL module

const JWT_SECRET = process.env.JWT_SECRET;

async function checkJwtMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Missing token in Authorization header' });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    // Verify user exists in the database using raw SQL
    const { rows } = await db.query(
      'SELECT user_id FROM user_profile WHERE user_id = $1',
      [payload.userId]
    );
    const user = rows[0];

    if (!user) {
      console.error('Token validation error: user not found in user_profile for userId:', payload.userId);
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    req.userId = user.user_id;
    next();
  } catch (err) {
    console.error('checkJwtMiddleware Error:', err.name, err.message);
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: `Unauthorized: Invalid token - ${err.message}` });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized (Middleware)' });
  }
}


function requireRole(requiredRole) {
  return (req, res, next) => {
    console.warn("DEPRECATION WARNING: requireRole middleware is used but global roles are not supported.");
    return res.status(500).json({ error: "Server configuration error: Global role check is not supported." });
  };
}

module.exports = { checkJwtMiddleware, requireRole };