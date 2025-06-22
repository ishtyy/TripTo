// backend/src/routes/locationRoutes.js
const express = require('express');
const { db, sql } = require('../db');
const { checkJwtMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/find-or-create', checkJwtMiddleware, async (req, res) => {
  const { latitude, longitude, location_name, country, description } = req.body;
  try {
    const row = await db.one(sql.locations.findOrCreate, [
      latitude, longitude, location_name, country, description || null
    ]);
    res.json({ location_id: row.location_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Location upsert failed' });
  }
});

module.exports = router;
