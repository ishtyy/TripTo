// backend/src/routes/usersRoutes.js
import express from "express";
import db from "../config/db.js";
import { checkJwtMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();



// NEW: Route to search for users by username
router.get("/search", async (req, res, next) => {
    const { q } = req.query; // q stands for query

    if (!q || q.length < 2) {
        // Return empty array if query is too short
        return res.json({ users: [] });
    }

    try {
        const query = `
            SELECT user_id, username, profile_picture_url 
            FROM user_profile 
            WHERE username ILIKE $1 
            LIMIT 10
        `;
        const params = [`%${q}%`]; // Use wildcards for partial, case-insensitive matching
        const { rows } = await db.query(query, params);
        res.json({ users: rows || [] });
    } catch (err) {
        next(err);
    }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
        SELECT user_id, username, email, profile_picture_url, bio, created_at
        FROM user_profile
        WHERE user_id = $1
    `;
    const { rows } = await db.query(query, [id]);
    const user = rows[0];

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: user });
  } catch (err) {
    console.error("Fetch User Profile Unexpected Error:", err);
    res.status(500).json({ error: "An unexpected error occurred while fetching user profile." });
  }
});


router.get("/:userId/communities", checkJwtMiddleware, async (req, res) => {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId;

    if (requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ error: "Forbidden: You can only view your own joined communities." });
    }

    try {
        const query = `
            SELECT
                cm.role AS user_role_in_community,
                cm.joined_at AS joined_community_at,
                c.community_id,
                c.community_name,
                c.description,
                json_build_object('location_name', l.location_name, 'country', l.country) AS location
            FROM community_membership cm
            JOIN community c ON cm.community_id = c.community_id
            LEFT JOIN location l ON c.location_id = l.location_id
            WHERE cm.user_id = $1
        `;

        const { rows } = await db.query(query, [requestedUserId]);
        console.log(`[usersRoutes] User ${requestedUserId} joined communities:`, rows.length);
        res.json({ communities: rows || [] });

    } catch (err) {
        console.error("Fetch Joined Communities Unexpected Error for user", requestedUserId, ":", err);
        res.status(500).json({ error: "An unexpected error occurred while fetching joined communities." });
    }
});

export default router;