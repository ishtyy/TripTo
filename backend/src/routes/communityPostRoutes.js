// backend/src/routes/communityPostRoutes.js
const express = require('express');
const { db, sql } = require('../db');
const { checkJwtMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// GET ?communityId=…
router.get('/', async (req, res) => {
  const { communityId } = req.query;
  if (!communityId) return res.status(400).json({ error: 'communityId required' });
  try {
    const posts = await db.any(sql.community_posts.getByCommunity, [ communityId ]);
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// POST create
router.post('/', checkJwtMiddleware, async (req, res) => {
  const { community_id, title, content } = req.body;
  try {
    const post = await db.one(sql.community_posts.create, [
      community_id, req.userId, title, content
    ]);
    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Create failed' });
  }
});

module.exports = router;
