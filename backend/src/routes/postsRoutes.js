const express = require("express");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");
const supabase = require("../config/supabaseClient");
const router = express.Router();

// GET /api/posts
router.get("/", async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from("blogpost")
      .select(`*, user_profile(username, profile_picture_url), location(location_name, country)`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ posts: posts || [] });
  } catch (err) {
    console.error("Fetch Posts Error:", err);
    return res.status(500).json({ error: "Could not fetch posts" });
  }
});

// POST /api/posts
router.post("/", checkJwtMiddleware, async (req, res) => {
  // **Match exactly what your front‐end sends here**:
  const { title, content, location_id } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Missing title or content" });
  }

  try {
    const { data: newPost, error } = await supabase
      .from("blogpost")
      .insert({
        post_id: require("uuid").v4(),
        author_id: req.userId,
        location_id,
        title: title.trim(),
        content: content.trim(),
        created_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      })
      .select(`*, user_profile(username, profile_picture_url), location(location_name, country)`)
      .single();

    if (error) throw error;
    return res.status(201).json({ post: newPost });
  } catch (err) {
    console.error("Create Post Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
