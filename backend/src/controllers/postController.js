import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// This is your main SQL query for fetching posts with all related data.
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
                'author', json_build_object('username', parent_author.username)
            )
            ELSE NULL
        END AS parent_post,
        (SELECT COUNT(*) FROM blog_comment WHERE post_id = p.post_id) as comment_count
    FROM blogpost p
    LEFT JOIN user_profiles up ON p.author_id = up.user_id
    LEFT JOIN locations l ON p.location_id = l.location_id
    LEFT JOIN blogpost AS parent ON p.parent_post_id = parent.post_id
    LEFT JOIN user_profiles AS parent_author ON parent.author_id = parent_author.user_id
`;

const getPostsWithUserVote = async (query, params, req) => {
    const userId = req.user?.user_id || null;
    const posts = await db.any(query, params);
    if (userId && posts.length > 0) {
        const postIds = posts.map(p => p.post_id);
        const votes = await db.any('SELECT post_id, vote_type FROM blog_post_votes WHERE user_id = $1 AND post_id = ANY($2)', [userId, postIds]);
        const voteMap = new Map(votes.map(v => [v.post_id, v.vote_type]));
        posts.forEach(p => { p.user_vote = voteMap.get(p.post_id) || null; });
    }
    return posts;
};

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
    const posts = await getPostsWithUserVote(query, params, req);
    res.json({ posts: posts || [] });
});

export const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await db.oneOrNone(`${postSelectQuery} WHERE p.post_id = $1`, [postId]);
    if (!post) { res.status(404); throw new Error('Post not found.'); }
    res.json({ post });
});

export const createPost = asyncHandler(async (req, res) => {
    const { title, content, location_id } = req.body;
    const author_id = req.user.user_id;
    const now = new Date();
    const newPost = await db.one(
        `INSERT INTO blogpost (author_id, location_id, title, content, created_at, last_updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [author_id, location_id, title.trim(), content.trim(), now, now]
    );
    res.status(201).json({ post: newPost });
});

export const voteOnPost = asyncHandler(async (req, res) => {
    const { id: post_id } = req.params;
    const { vote_type } = req.body;
    const user_id = req.user.user_id;
    const existingVote = await db.oneOrNone('SELECT * FROM blog_post_votes WHERE user_id = $1 AND post_id = $2', [user_id, post_id]);
    if (existingVote) {
        if (vote_type === null || existingVote.vote_type === vote_type) {
            await db.none('DELETE FROM blog_post_votes WHERE vote_id = $1', [existingVote.vote_id]);
        } else {
            await db.none('UPDATE blog_post_votes SET vote_type = $1 WHERE vote_id = $2', [vote_type, existingVote.vote_id]);
        }
    } else if (vote_type !== null) {
        await db.none('INSERT INTO blog_post_votes (user_id, post_id, vote_type) VALUES ($1, $2, $3)', [user_id, post_id, vote_type]);
    }
    res.status(200).json({ success: true, message: 'Vote recorded.' });
});

export const cascadePost = asyncHandler(async (req, res) => {
    const { postId: parent_post_id } = req.params;
    const user_id = req.user.user_id;
    const { title, content } = req.body;
    const parent = await db.oneOrNone('SELECT location_id FROM blogpost WHERE post_id = $1', [parent_post_id]);
    if (!parent) { res.status(404); throw new Error('Original post not found.'); }
    const now = new Date();
    const newPost = await db.one(`INSERT INTO blogpost (author_id, location_id, title, content, parent_post_id, created_at, last_updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [user_id, parent.location_id, title, content, parent_post_id, now, now]);
    res.status(201).json({ post: newPost });
});

export const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const query = `
        SELECT c.comment_id, c.content, c.created_at, json_build_object('user_id', u.user_id, 'username', u.username, 'profile_picture_url', u.profile_picture_url) as user
        FROM blog_comment c JOIN user_profiles u ON c.user_id = u.user_id
        WHERE c.post_id = $1 ORDER BY c.created_at ASC
    `;
    const comments = await db.any(query, [postId]);
    res.json(comments);
});

export const createCommentOnPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const user_id = req.user.user_id;
    if (!content || content.trim() === '') { res.status(400); throw new Error('Comment content cannot be empty.'); }
    const newComment = await db.one(`INSERT INTO blog_comment (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING comment_id`, [postId, user_id, content.trim()]);
    const createdComment = await db.one(`SELECT c.*, json_build_object('user_id', u.user_id, 'username', u.username, 'profile_picture_url', u.profile_picture_url) as user FROM blog_comment c JOIN user_profiles u ON c.user_id = u.user_id WHERE c.comment_id = $1`, [newComment.comment_id]);
    res.status(201).json(createdComment);
});
