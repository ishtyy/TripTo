// backend/src/routes/communityRoutes.js
const express = require('express');
const { db, sql } = require('../db');
const { checkJwtMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// GET all
router.get('/', async (_, res) => {
  try {
    const list = await db.any(sql.communities.getAll);
    res.json({ communities: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// GET one
router.get('/:communityId', async (req, res) => {
  try {
    const c = await db.oneOrNone(sql.communities.getById, [ req.params.communityId ]);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({ community: c });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// POST create
router.post('/', checkJwtMiddleware, async (req, res) => {
  try {
    // createCommunity.sql does both: insert community + insert membership
    await db.none(sql.communities.create, [
      req.body.community_name,
      req.body.description,
      req.body.location_id,
      req.userId
    ]);
    // then fetch the newly created row:
    const newC = await db.oneOrNone(sql.communities.getById, [ /* use RETURNING or last insert id... */ ]);
    res.status(201).json({ community: newC });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Create failed' });
  }
});

// GET membership
router.get('/:communityId/membership', checkJwtMiddleware, async (req, res) => {
  try {
    const m = await db.oneOrNone(sql.communities.getMembership, [
      req.params.communityId,
      req.userId
    ]);
    res.json({ membership: m || null });
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// POST join
router.post('/:communityId/join', checkJwtMiddleware, async (req, res) => {
  try {
    const m = await db.one(sql.communities.join, [
      req.params.communityId, req.userId
    ]);
    res.status(201).json({ membership: m });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Join failed' });
  }
});

// DELETE leave
router.delete('/:communityId/leave', checkJwtMiddleware, async (req, res) => {
  try {
    await db.oneOrNone(sql.communities.leave, [
      req.params.communityId, req.userId
    ]);
    res.json({ message: 'Left' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Leave failed' });
  }
});

// GET members
router.get('/:communityId/members', async (req, res) => {
  try {
    const members = await db.any(sql.communities.getMembers, [
      req.params.communityId
    ]);
    res.json({ members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

module.exports = router;
