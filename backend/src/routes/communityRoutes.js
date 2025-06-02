// backend/src/routes/communityRoutes.js

const express           = require("express");
const supabase          = require("../config/supabaseClient");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/communities
 * Return all existing communities
 */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("community")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ communities: data });
  } catch (err) {
    console.error("Fetch Communities Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/communities
 * Body: { community_name, description, location_id }
 * Requires a valid JWT; the creator becomes “community_admin.”
 */
router.post("/", checkJwtMiddleware, async (req, res) => {
  try {
    const { community_name, description, location_id } = req.body;
    const user_id = req.userId; // from checkJwtMiddleware
    if (!community_name || !description || !location_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert community
    const { data: newCommunity, error: insertError } = await supabase
      .from("community")
      .insert(
        [{ community_id: require("uuid").v4(),
           location_id,
           community_name,
           description,
           created_at: new Date().toISOString() }],
        { returning: "representation" }
      )
      .single();

    if (insertError) throw insertError;

    // Add creator as admin in community_membership
    const { error: memError } = await supabase
      .from("community_membership")
      .insert([
        {
          membership_id: require("uuid").v4(),
          community_id: newCommunity.community_id,
          user_id,
          joined_at: new Date().toISOString(),
          role: "admin",
        },
      ]);
    if (memError) throw memError;

    return res.status(201).json({ community: newCommunity });
  } catch (err) {
    console.error("Create Community Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
