// backend/src/routes/postsRoutes.js
const express = require("express");
const db = require("../config/db");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();



/**
 * GET /api/posts
 */
router.get("/", async (req, res, next) => {
  try {
    const { user_id, limit, q } = req.query; // Added 'q' for search query

    let queryText = `
      SELECT
        p.post_id, p.title, p.content, p.created_at, p.author_id, p.location_id,
        json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) AS user_profile,
        json_build_object('location_name', l.location_name, 'country', l.country) AS location
      FROM blogpost p
      LEFT JOIN user_profile up ON p.author_id = up.user_id
      LEFT JOIN location l ON p.location_id = l.location_id
    `;
    const params = [];
    const conditions = [];

    if (user_id) {
      params.push(user_id);
      conditions.push(`p.author_id = $${params.length}`);
    }
    
    // Add condition for text search
    if (q) {
      params.push(`%${q}%`); // Add wildcards for partial matching
      conditions.push(`p.title ILIKE $${params.length}`); // ILIKE for case-insensitive search
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    if (limit) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    const { rows } = await db.query(queryText, params);
    res.json({ posts: rows || [] });
  } catch (err) {
    next(err);
  }
});

// NEW: Route to get a single blog post by its ID
router.get("/:postId", async (req, res, next) => {
    const { postId } = req.params;
    try {
        const query = `
            SELECT
                p.post_id, p.title, p.content, p.created_at, p.author_id, p.location_id,
                json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) AS user_profile,
                json_build_object('location_name', l.location_name, 'country', l.country) AS location
            FROM blogpost p
            LEFT JOIN user_profile up ON p.author_id = up.user_id
            LEFT JOIN location l ON p.location_id = l.location_id
            WHERE p.post_id = $1
        `;
        const { rows } = await db.query(query, [postId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Post not found." });
        }
        res.json({ post: rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/posts
 * Body: { title, content, location_id }
 */
router.post("/", checkJwtMiddleware, async (req, res) => {
  try {
    const { title, content, location_id } = req.body;
    const author_id = req.userId;

    if (!title || !content || !location_id) {
      return res.status(400).json({ error: "Title, content, and location_id are required." });
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(location_id)) {
        return res.status(400).json({ error: "Invalid location_id format. Must be a UUID." });
    }

    // --- FIX START ---
    // Added created_at and last_updated_at to the INSERT statement
    const insertQuery = `
      WITH inserted_post AS (
        INSERT INTO blogpost (author_id, location_id, title, content, created_at, last_updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      )
      SELECT
        ip.*,
        json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile,
        json_build_object('location_name', l.location_name, 'country', l.country) as location
      FROM inserted_post ip
      JOIN user_profile up ON ip.author_id = up.user_id
      JOIN location l ON ip.location_id = l.location_id;
    `;
    
    const now = new Date().toISOString(); // Get the current timestamp
    // Added the timestamp to the values array for the new columns
    const values = [author_id, location_id, title.trim(), content.trim(), now, now];
    // --- FIX END ---

    const { rows } = await db.query(insertQuery, values);
    const newPost = rows[0];

    if (!newPost || !newPost.post_id) {
        console.error("[postsRoutes] Post creation failed to return data or post_id after insert.");
        return res.status(500).json({ error: "Post creation failed to return data or post_id." });
    }

    console.log("[postsRoutes] Post created successfully:", newPost);
    res.status(201).json({ post: newPost });
  } catch (err) {
    console.error("Create Post Endpoint - Unexpected Error:", err);
    if (err.code === '23503') { // Foreign key violation
        return res.status(400).json({ error: "Invalid author_id or location_id. Ensure they exist." });
    }
    // Handle the not-null violation specifically for better error message
    if (err.code === '23502') {
        return res.status(500).json({ error: `Database error: A required value was missing for the '${err.column}' column.`})
    }
    res.status(500).json({ error: "An unexpected error occurred while creating the post." });
  }
});

module.exports = router;