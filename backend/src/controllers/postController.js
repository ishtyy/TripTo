// src/controllers/postController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

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
    LEFT JOIN user_profiles up ON p.author_id = up.user_id
    LEFT JOIN locations l ON p.location_id = l.location_id
    LEFT JOIN blogpost AS parent ON p.parent_post_id = parent.post_id
    LEFT JOIN user_profiles AS parent_author ON parent.author_id = parent_author.user_id
`;

export const getAllPosts = asyncHandler(async (req, res) => {
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

    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY p.created_at DESC`;
    if (limit) {
        params.push(limit);
        query += ` LIMIT $${params.length}`;
    }

    try {
        const rows = await db.any(query, params);
        res.json({ posts: rows || [] });
    } catch (err) {
        console.error('[getAllPosts] SQL error:', err);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

export const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const rows = await db.any(`${postSelectQuery} WHERE p.post_id = $1`, [postId]);
    if (rows.length === 0) {
        res.status(404);
        throw new Error('Post not found.');
    }
    res.json({ post: rows[0] });
});

export const createPost = asyncHandler(async (req, res) => {
    const { title, content, location_id } = req.body;
    const author_id = req.userId;

    if (!title || !content || !location_id) {
        res.status(400);
        throw new Error('Title, content, and location_id are required.');
    }

    const now = new Date();
    const insertQuery = `
    WITH inserted_post AS (
      INSERT INTO blogpost (author_id, location_id, title, content, created_at, last_updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    )
    SELECT ip.*, json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile,
           json_build_object('location_name', l.location_name, 'country', l.country) as location
    FROM inserted_post ip
    JOIN user_profiles up ON ip.author_id = up.user_id
    JOIN locations l ON ip.location_id = l.location_id;
  `;
    const values = [author_id, location_id, title.trim(), content.trim(), now, now];
    const rows = await db.any(insertQuery, values);
    res.status(201).json({ post: rows[0] });
});

export const votePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const user_id = req.userId;
    const { vote_type } = req.body;

    if (vote_type !== 1 && vote_type !== -1) {
        res.status(400);
        throw new Error('Invalid vote type.');
    }

    const result = await db.tx(async t => {
        const existingVote = await t.oneOrNone(
            'SELECT vote_type FROM blog_post_votes WHERE post_id = $1 AND user_id = $2',
            [postId, user_id]
        );

        let upvote_change = 0;
        let downvote_change = 0;

        if (existingVote) {
            if (existingVote.vote_type === vote_type) {
                await t.none('DELETE FROM blog_post_votes WHERE post_id = $1 AND user_id = $2', [postId, user_id]);
                vote_type === 1 ? upvote_change-- : downvote_change--;
            } else {
                await t.none(
                    'UPDATE blog_post_votes SET vote_type = $1 WHERE post_id = $2 AND user_id = $3',
                    [vote_type, postId, user_id]
                );
                if (vote_type === 1) {
                    upvote_change++;
                    downvote_change--;
                } else {
                    upvote_change--;
                    downvote_change++;
                }
            }
        } else {
            await t.none(
                'INSERT INTO blog_post_votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)',
                [postId, user_id, vote_type]
            );
            vote_type === 1 ? upvote_change++ : downvote_change++;
        }

        const counts = await t.one(
            `UPDATE blogpost
       SET upvote_count = upvote_count + $1,
           downvote_count = downvote_count + $2
       WHERE post_id = $3
       RETURNING upvote_count, downvote_count`,
            [upvote_change, downvote_change, postId]
        );

        return counts;
    });

    res.status(200).json(result);
});

export const cascadePost = asyncHandler(async (req, res) => {
    const { postId: parent_post_id } = req.params;
    const user_id = req.userId;
    const { title, content } = req.body;

    if (!title || !content) {
        res.status(400);
        throw new Error('Title and content are required for a cascade.');
    }

    const result = await db.tx(async t => {
        const parent = await t.oneOrNone(
            'SELECT location_id FROM blogpost WHERE post_id = $1',
            [parent_post_id]
        );
        if (!parent) throw new Error('Original post not found.');

        const now = new Date();
        const newPost = await t.one(
            `INSERT INTO blogpost (author_id, location_id, title, content, parent_post_id, created_at, last_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [user_id, parent.location_id, title, content, parent_post_id, now, now]
        );

        await t.none(
            'UPDATE blogpost SET cascade_count = cascade_count + 1 WHERE post_id = $1',
            [parent_post_id]
        );

        return newPost;
    });

    res.status(201).json({ post: result });
});

