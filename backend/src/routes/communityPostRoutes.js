const express = require("express");
const db = require("../config/db");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();


router.get("/", async (req, res, next) => {
    const { communityId } = req.query;

    if (!communityId) {
        return res.status(400).json({ error: "Community ID is required." });
    }

    try {
        const query = `
            SELECT
                cp.post_id,
                cp.community_id,
                cp.user_id,
                cp.title,
                cp.content,
                cp.created_at,
                cp.is_pinned,
                cp.is_featured,
                cp.upvote_count,
                cp.downvote_count,
                json_build_object(
                    'username', up.username,
                    'profile_picture_url', up.profile_picture_url
                ) AS user_profile
            FROM community_post cp
            JOIN user_profile up ON cp.user_id = up.user_id
            WHERE cp.community_id = $1
            ORDER BY cp.is_pinned DESC, cp.created_at DESC
        `;
        const { rows } = await db.query(query, [communityId]);
        res.json({ posts: rows || [] });
    } catch (err) {
        next(err);
    }
});


router.post("/", checkJwtMiddleware, async (req, res, next) => {
    const { community_id, title, content } = req.body;
    const user_id = req.userId;

    if (!community_id || !title || !content || !title.trim() || !content.trim()) {
        return res.status(400).json({ error: "Community ID, title, and content are required." });
    }

    try {
        const { rows: membershipRows } = await db.query(
            'SELECT user_id FROM community_membership WHERE community_id = $1 AND user_id = $2',
            [community_id, user_id]
        );

        if (membershipRows.length === 0) {
            return res.status(403).json({ error: "User is not a member of this community and cannot post." });
        }

        const insertQuery = `
            WITH new_post AS (
                INSERT INTO community_post (community_id, user_id, title, content, created_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            )
            SELECT
                np.*,
                json_build_object(
                    'username', up.username,
                    'profile_picture_url', up.profile_picture_url
                ) AS user_profile
            FROM new_post np
            JOIN user_profile up ON np.user_id = up.user_id
        `;
        
        const values = [community_id, user_id, title.trim(), content.trim(), new Date()];
        const { rows } = await db.query(insertQuery, values);
        
        if (!rows[0] || !rows[0].post_id) {
             return res.status(500).json({ error: "Community post creation failed to return the created post." });
        }
        
        res.status(201).json({ post: rows[0] });

    } catch (err) {
        next(err);
    }
});

module.exports = router;