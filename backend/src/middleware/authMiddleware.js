// src/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const checkJwtMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token in Authorization header' });
    }

    // Verify Supabase JWT
    const payload = jwt.verify(token, JWT_SECRET);

    // Optionally check if user exists in DB
    const user = await db.oneOrNone(
      'SELECT user_id FROM user_profiles WHERE user_id = $1',
      [payload.userId]
    );

    if (!user) {
      console.error('Token validation error: user not found in user_profiles for userId:', payload.sub);
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Attach user info to request
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
};


export function requireRole(requiredRole) {
  return async (req, res, next) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. No userId found.' });
    }

    const user = await db.oneOrNone(
      'SELECT role FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== requiredRole) {
      return res.status(403).json({ error: `Forbidden. Requires role: ${requiredRole}` });
    }

    next();
  };
}