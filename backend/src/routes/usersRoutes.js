// backend/src/routes/usersRoutes.js
const express = require('express');
const { db, sql } = require('../db');
const { checkJwtMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await db.oneOrNone(sql.users.getProfile, [ req.params.id ]);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// GET /api/users/:id/communities
router.get('/:id/communities', checkJwtMiddleware, async (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).end();
  try {
    const comms = await db.any(sql.users.getUserCommunities, [ req.userId ]);
    res.json({ communities: comms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

module.exports = router;
