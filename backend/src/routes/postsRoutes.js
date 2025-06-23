const express = require("express");
const db = require("../config/db");
const { checkJwtMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const postSelectQuery = `
    SELECT
        p.post_id, p.title, p.content, p.created_at, p.author_id, p.location_id,
        p.upvote_count, p.downvote_count, p.cascade_count, p.parent_post_id,
        json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) AS user_profile,
        json_build_object('location_name', l.location_name, 'country', l.country) AS location,
        CASE
            WHEN p.parent_post_id IS NOT NULL THEN json_build_object(
                'post_id', parent.post_id,
                'title', parent.title,
                'content', parent.content,
                'author', json_build_object('username', parent_author.username)
            )
            ELSE NULL
        END AS parent_post
    FROM blogpost p
    LEFT JOIN user_profile up ON p.author_id = up.user_id
    LEFT JOIN location l ON p.location_id = l.location_id
    LEFT JOIN blogpost AS parent ON p.parent_post_id = parent.post_id
    LEFT JOIN user_profile AS parent_author ON parent.author_id = parent_author.user_id
`;

router.get("/", async (req, res, next) => {
  try {
    const { user_id, limit, q } = req.query;
    let query = postSelectQuery;
    const params = [];
    const conditions = [];

    if (user_id) {
      params.push(user_id);
      conditions.push(`p.author_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`p.title ILIKE $${params.length}`);
    }

    if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` ORDER BY p.created_at DESC`;
    if (limit) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    const { rows } = await db.query(query, params);
    res.json({ posts: rows || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/:postId", async (req, res, next) => {
    const { postId } = req.params;
    try {
        const query = `${postSelectQuery} WHERE p.post_id = $1`;
        const { rows } = await db.query(query, [postId]);
        if (rows.length === 0) return res.status(404).json({ error: "Post not found." });
        res.json({ post: rows[0] });
    } catch (err) {
        next(err);
    }
});

router.post("/:postId/vote", checkJwtMiddleware, async (req, res, next) => {
    const { postId } = req.params;
    const user_id = req.userId;
    const { vote_type } = req.body;

    if (vote_type !== 1 && vote_type !== -1) {
        return res.status(400).json({ error: "Invalid vote type." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const existingVoteRes = await client.query('SELECT vote_type FROM blog_post_votes WHERE post_id = $1 AND user_id = $2', [postId, user_id]);
        const existingVote = existingVoteRes.rows[0];
        let upvote_change = 0;
        let downvote_change = 0;

        if (existingVote) {
            if (existingVote.vote_type === vote_type) {
                await client.query('DELETE FROM blog_post_votes WHERE post_id = $1 AND user_id = $2', [postId, user_id]);
                if (vote_type === 1) upvote_change = -1; else downvote_change = -1;
            } else {
                await client.query('UPDATE blog_post_votes SET vote_type = $1 WHERE post_id = $2 AND user_id = $3', [vote_type, postId, user_id]);
                if (vote_type === 1) { upvote_change = 1; downvote_change = -1; } else { upvote_change = -1; downvote_change = 1; }
            }
        } else {
            await client.query('INSERT INTO blog_post_votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)', [postId, user_id, vote_type]);
            if (vote_type === 1) upvote_change = 1; else downvote_change = 1;
        }

        const updateQuery = `UPDATE blogpost SET upvote_count = upvote_count + $1, downvote_count = downvote_count + $2 WHERE post_id = $3 RETURNING upvote_count, downvote_count`;
        const updatedCountsRes = await client.query(updateQuery, [upvote_change, downvote_change, postId]);
        
        await client.query('COMMIT');
        res.status(200).json(updatedCountsRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

router.post("/:postId/cascade", checkJwtMiddleware, async (req, res, next) => {
    const { postId: parent_post_id } = req.params;
    const user_id = req.userId;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required for a cascade." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const parentPostRes = await client.query('SELECT location_id FROM blogpost WHERE post_id = $1', [parent_post_id]);
        if (parentPostRes.rows.length === 0) {
            return res.status(404).json({ error: "Original post not found." });
        }
        const location_id = parentPostRes.rows[0].location_id;

        const insertQuery = `INSERT INTO blogpost (author_id, location_id, title, content, parent_post_id, created_at, last_updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const newPostRes = await client.query(insertQuery, [user_id, location_id, title, content, parent_post_id, new Date(), new Date()]);

        await client.query('UPDATE blogpost SET cascade_count = cascade_count + 1 WHERE post_id = $1', [parent_post_id]);

        await client.query('COMMIT');
        res.status(201).json({ post: newPostRes.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

router.post("/", checkJwtMiddleware, async (req, res, next) => {
  try {
    const { title, content, location_id } = req.body;
    const author_id = req.userId;

    if (!title || !content || !location_id) {
      return res.status(400).json({ error: "Title, content, and location_id are required." });
    }

    const now = new Date();
    const insertQuery = `
      WITH inserted_post AS (
        INSERT INTO blogpost (author_id, location_id, title, content, created_at, last_updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      )
      SELECT ip.*, json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile, json_build_object('location_name', l.location_name, 'country', l.country) as location
      FROM inserted_post ip
      JOIN user_profile up ON ip.author_id = up.user_id
      JOIN location l ON ip.location_id = l.location_id;
    `;
    const values = [author_id, location_id, title.trim(), content.trim(), now, now];
    
    const { rows } = await db.query(insertQuery, values);
    res.status(201).json({ post: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;