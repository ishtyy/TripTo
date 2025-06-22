const express = require("express");
const db = require("../config/db");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();


router.get("/", async (req, res, next) => {
  try {
    const { limit, q } = req.query; 

    let query = `
        SELECT
            c.community_id, c.community_name, c.description, c.created_at, c.location_id,
            json_build_object('location_name', l.location_name, 'country', l.country) AS location
        FROM community c
        LEFT JOIN location l ON c.location_id = l.location_id
    `;
    const params = [];
    const conditions = [];

    if (q) {
        params.push(`%${q}%`);
        // Search in both name and description
        conditions.push(`(c.community_name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }

    if(conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY c.created_at DESC`;

    if (limit) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    const { rows } = await db.query(query, params);
    res.json({ communities: rows || [] });
  } catch (err) {
    next(err);
  }
});



router.get("/:communityId", async (req, res, next) => {
    const { communityId } = req.params;
    try {
        const query = `
            SELECT
                c.community_id, c.community_name, c.description, c.created_at, c.location_id,
                json_build_object('location_name', l.location_name, 'country', l.country) AS location
            FROM community c
            LEFT JOIN location l ON c.location_id = l.location_id
            WHERE c.community_id = $1
        `;
        const { rows } = await db.query(query, [communityId]);
        const community = rows[0];

        if (!community) {
            return res.status(404).json({ error: "Community not found." });
        }
        res.json({ community });
    } catch (err) {
        next(err);
    }
});


router.post("/", checkJwtMiddleware, async (req, res, next) => {
  const { community_name, description, location_id } = req.body;
  const creator_user_id = req.userId;

  if (!community_name || !description || !location_id) {
    return res.status(400).json({ error: "Community name, description, and location_id are required." });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const communityQuery = `
      INSERT INTO community (community_name, description, location_id, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const communityValues = [community_name.trim(), description.trim(), location_id, new Date()];
    const communityRes = await client.query(communityQuery, communityValues);
    const newCommunity = communityRes.rows[0];

    // --- FIX: Added joined_at to the INSERT statement ---
    const membershipQuery = `
      INSERT INTO community_membership (community_id, user_id, role, joined_at)
      VALUES ($1, $2, 'admin', $3)
    `;
    // --- FIX: Added new Date() to the values array ---
    await client.query(membershipQuery, [newCommunity.community_id, creator_user_id, new Date()]);
    
    const locationRes = await client.query('SELECT location_name, country FROM location WHERE location_id = $1', [newCommunity.location_id]);
    
    const finalCommunityResponse = {
        ...newCommunity,
        location: locationRes.rows[0] || null
    };
    
    await client.query('COMMIT');
    res.status(201).json({ community: finalCommunityResponse });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});


router.get("/:communityId/membership", checkJwtMiddleware, async (req, res, next) => {
    const { communityId } = req.params;
    const userId = req.userId;
    try {
        const { rows } = await db.query('SELECT user_id, community_id, role, joined_at FROM community_membership WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
        if (rows.length > 0) {
            res.json({ isMember: true, role: rows[0].role, details: rows[0] });
        } else {
            res.json({ isMember: false, role: null });
        }
    } catch (err) {
        next(err);
    }
});

router.post("/:communityId/join", checkJwtMiddleware, async (req, res, next) => {
    const { communityId } = req.params;
    const userId = req.userId;
    try {
        const { rows: existing } = await db.query('SELECT user_id FROM community_membership WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "User is already a member of this community." });
        }
        
        // --- FIX: Added joined_at to the INSERT statement ---
        const insertQuery = `
            INSERT INTO community_membership (community_id, user_id, role, joined_at)
            VALUES ($1, $2, 'member', $3)
            RETURNING *
        `;
        // --- FIX: Added new Date() to the values array ---
        const { rows } = await db.query(insertQuery, [communityId, userId, new Date()]);
        res.status(201).json({ message: "Successfully joined community.", membership: rows[0] });
    } catch (err) {
        next(err);
    }
});

router.delete("/:communityId/leave", checkJwtMiddleware, async (req, res, next) => {
    const { communityId } = req.params;
    const userId = req.userId;
    try {
        const result = await db.query('DELETE FROM community_membership WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Membership not found." });
        }
        res.status(200).json({ message: "Successfully left community." });
    } catch (err) {
        next(err);
    }
});

router.get("/:communityId/members", async (req, res, next) => {
    const { communityId } = req.params;
    try {
        const query = `
            SELECT cm.user_id, cm.role, cm.joined_at, json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) AS user_profile
            FROM community_membership cm
            JOIN user_profile up ON cm.user_id = up.user_id
            WHERE cm.community_id = $1
            ORDER BY cm.joined_at ASC
        `;
        const { rows } = await db.query(query, [communityId]);
        res.json({ members: rows || [] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;