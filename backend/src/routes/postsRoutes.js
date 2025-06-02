// backend/src/routes/postsRoutes.js

const express = require("express");
const supabase = require("../config/supabaseClient");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/posts
 * Optional query parameters:
 *   - community_id (uuid): if provided, only return posts for that community
 *   - user_id (uuid): if provided, only return posts by that user
 *   - limit, offset, etc. (you can add more as needed)
 */
router.get("/", async (req, res) => {
  try {
    const { community_id, user_id } = req.query;
    let query = supabase.from("blogpost").select(
      `
      post_id,
      title,
      content,
      created_at,
      author_id,
      user_profile(username)
    `
    );

    if (community_id) {
      query = query.eq("location_id", community_id);
    }
    if (user_id) {
      query = query.eq("author_id", user_id);
    }

    // Order by newest first:
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    res.json({ posts: data });
  } catch (err) {
    console.error("Fetch Posts Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/posts
 * Body: { title, content, location_id (community), ... }
 * Must be authenticated (checkJwtMiddleware).
 */
router.post("/", checkJwtMiddleware, async (req, res) => {
  try {
    const { title, content, location_id } = req.body;
    const author_id = req.userId; // from JWT middleware

    if (!title || !content || !location_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: newPost, error } = await supabase
      .from("blogpost")
      .insert([
        {
          title,
          content,
          location_id,
          author_id,
          created_at: new Date(),
          last_updated_at: new Date(),
        },
      ])
      .single();
    if (error) throw error;
    res.status(201).json({ post: newPost });
  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
