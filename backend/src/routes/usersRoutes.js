// backend/src/routes/usersRoutes.js
const express = require("express");
const supabase = require("../config/supabaseClient");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/users/:id  → fetch a single user’s public profile
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("user_profile")
      .select("user_id, username, email, profile_picture_url, bio, created_at")
      .eq("user_id", id)
      .single();

    if (error) {
        console.error("Fetch User Profile Error:", error);
        if (error.code === 'PGRST116' || error.details?.includes('0 rows')) {
            return res.status(404).json({ error: "User not found." });
        }
        // For other errors, let the generic handler catch it or return 500
        return res.status(500).json({ error: "Database error fetching user profile."});
    }
    if (!data) { 
        return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: data });
  } catch (err) {
    console.error("Fetch User Profile Unexpected Error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching user profile." });
  }
});


// GET /api/users/:userId/communities → fetch communities a specific user has joined
router.get("/:userId/communities", checkJwtMiddleware, async (req, res) => {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId; // From checkJwtMiddleware

    if (requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ error: "Forbidden: You can only view your own joined communities." });
    }

    try {
        // Fetch memberships and join with community details
        const { data: memberships, error } = await supabase
            .from("community_membership")
            .select(`
                role,
                joined_at,
                community:community_id ( 
                    community_id,
                    community_name,
                    description,
                    location:location_id ( location_name, country ) 
                )
            `)
            .eq("user_id", requestedUserId)
            .not("community", "is", null); // Ensure community data is present

        if (error) {
            console.error("Fetch Joined Communities Error for user", requestedUserId, ":", error);
            return res.status(500).json({ error: "Failed to retrieve joined communities due to a database error." });
        }

        // Transform data to a simpler array of community objects, filtering out any null communities if the join somehow allowed it
        const joinedCommunitiesData = memberships
            .filter(m => m.community) // Ensure the community object exists
            .map(m => ({
                ...m.community, // Spread community details (community_id, community_name, description, location)
                user_role_in_community: m.role,
                joined_community_at: m.joined_at
            }));
        
        console.log(`[usersRoutes] User ${requestedUserId} joined communities:`, joinedCommunitiesData.length);
        res.json({ communities: joinedCommunitiesData || [] });

    } catch (err) {
        console.error("Fetch Joined Communities Unexpected Error for user", requestedUserId, ":", err);
        res.status(500).json({ error: "An unexpected error occurred while fetching joined communities." });
    }
});

module.exports = router;
