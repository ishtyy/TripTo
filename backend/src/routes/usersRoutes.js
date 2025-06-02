// backend/src/routes/usersRoutes.js

const express = require("express");
const supabase = require("../config/supabaseClient");

const router = express.Router();

// GET /api/users/:id  → fetch a single user’s profile
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("user_profile")
      .select("user_id, username, email, profile_picture_url, bio")
      .eq("user_id", id)
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    console.error("Fetch User Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
