// backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db, sql } = require('../db');
const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const emailLc  = email.trim().toLowerCase();
    const password_hash = await bcrypt.hash(password, 10);
    const user = await db.one(sql.auth.register, [ emailLc, password_hash, username.trim() ]);
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'User already exists.' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const row = await db.one(sql.auth.login, [ email.trim().toLowerCase() ]);
    const valid = await bcrypt.compare(password, row.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const { password:_, ...user } = row;
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;
