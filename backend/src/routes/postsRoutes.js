// backend/src/routes/postsRoutes.js
const express = require("express");
const supabase = require("../config/supabaseClient");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");
// const { v4: uuidv4 } = require('uuid'); // No longer needed if DB generates ID

const router = express.Router();

/**
 * GET /api/posts
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
      user_profile ( username, profile_picture_url ), 
      location_id,
      location ( location_name, country )
    `
    );

    if (req.query.location_id_for_community_filter) {
        query = query.eq("location_id", req.query.location_id_for_community_filter);
    }
    if (user_id) {
      query = query.eq("author_id", user_id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (err) {
    console.error("Fetch Posts Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/posts
 * Body: { title, content, location_id (must be a valid UUID from 'location' table) }
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

    const newPostData = {
      // post_id: uuidv4(), // REMOVE THIS (DB will generate it)
      author_id,
      location_id,
      title: title.trim(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
    };

    console.log("[postsRoutes] Creating post with data (DB generates post_id):", newPostData);

    const { data: newPost, error: insertError } = await supabase
      .from("blogpost")
      .insert(newPostData)
      .select(`
        *,
        user_profile ( username, profile_picture_url ),
        location ( location_name, country )
      `) // Ensure post_id is selected
      .single();

    if (insertError) {
      console.error("Create Post - Insert Error:", insertError);
      if (insertError.code === '23503') { 
          return res.status(400).json({ error: "Invalid author_id or location_id. Ensure they exist." });
      }
      return res.status(500).json({ error: `Failed to create post: ${insertError.message}` });
    }
    if (!newPost || !newPost.post_id) { // Check for post_id
        console.error("[postsRoutes] Post creation failed to return data or post_id after insert.");
        return res.status(500).json({ error: "Post creation failed to return data or post_id." });
    }

    console.log("[postsRoutes] Post created successfully:", newPost);
    res.status(201).json({ post: newPost });
  } catch (err) {
    console.error("Create Post Endpoint - Unexpected Error:", err);
    res.status(500).json({ error: "An unexpected error occurred while creating the post." });
  }
});

module.exports = router;
