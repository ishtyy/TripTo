import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const getPostsWithUserVote = async (query, params, req) => {
    const userId = req.user?.user_id || null;
    const posts = await db.any(query, params);
    if (userId && posts.length > 0) {
        const postIds = posts.map(p => p.post_id);
        if (postIds.length > 0) {
            const votes = await db.any('SELECT post_id, vote_type FROM community_post_votes WHERE user_id = $1 AND post_id = ANY($2)', [userId, postIds]);
            const voteMap = new Map(votes.map(v => [v.post_id, v.vote_type]));
            posts.forEach(p => { p.user_vote = voteMap.get(p.post_id) || null; });
        }
    }
    return posts;
};

export const getPosts = asyncHandler(async (req, res) => {
    const { communityId, sortBy = 'latest' } = req.query;
    if (!communityId) {
        res.status(400); throw new Error('Community ID is required.');
    }
    let orderByClause = 'ORDER BY cp.is_pinned DESC, cp.created_at DESC';
    if (sortBy === 'top') {
        orderByClause = 'ORDER BY (cp.upvote_count - cp.downvote_count) DESC, cp.created_at DESC';
    }
    const query = `
        SELECT cp.*, 
               json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile,
               (SELECT COUNT(*) FROM comment WHERE post_id = cp.post_id) as comment_count
        FROM community_post cp
        JOIN user_profiles up ON cp.user_id = up.user_id
        WHERE cp.community_id = $1
        ${orderByClause}
    `;
    const posts = await getPostsWithUserVote(query, [communityId], req);
    res.json({ posts: posts || [] });
});

export const createPost = asyncHandler(async (req, res) => {
    const { community_id, title, content } = req.body;
    const user_id = req.user.user_id;

    // Check for membership
    const isMember = await db.oneOrNone('SELECT user_id FROM community_membership WHERE community_id = $1 AND user_id = $2', [community_id, user_id]);
    if (!isMember) {
        res.status(403);
        throw new Error('User is not a member of this community and cannot post.');
    }

    if (!community_id || !title?.trim()) {
        res.status(400);
        throw new Error('Community ID and a title are required.');
    }

    // ✅ FIX: The INSERT statement now correctly includes `created_at`
    const newPost = await db.one(
        `INSERT INTO community_post (community_id, user_id, title, content, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`, 
        [community_id, user_id, title.trim(), content.trim()]
    );

    // Fetch the newly created post with user profile details
    const createdPost = await db.one(
        `SELECT cp.*, json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile 
         FROM community_post cp 
         JOIN user_profiles up ON cp.user_id = up.user_id 
         WHERE cp.post_id = $1`, 
        [newPost.post_id]
    );
    
    res.status(201).json(createdPost);
});

export const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const query = `
        SELECT cp.*, json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile
        FROM community_post cp
        JOIN user_profiles up ON cp.user_id = up.user_id
        WHERE cp.post_id = $1
    `;
    const post = await db.oneOrNone(query, [postId]);
    if (!post) {
        res.status(404);
        throw new Error('Post not found.');
    }
    res.json(post);
});

export const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    const user_id = req.user.user_id;

    // Check if the post exists
    const post = await db.oneOrNone('SELECT * FROM community_post WHERE post_id = $1 AND user_id = $2', [postId, user_id]);
    if (!post) {
        res.status(404);
        throw new Error('Post not found or user not authorized.');
    }

    // Update the post
    const updatedPost = await db.one(
        `UPDATE community_post SET title = $1, content = $2 WHERE post_id = $3 RETURNING *`,
        [title?.trim(), content?.trim(), postId]
    );

    res.json(updatedPost);
});

export const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const user_id = req.user.user_id;

    // Check if the post exists
    const post = await db.oneOrNone('SELECT * FROM community_post WHERE post_id = $1 AND user_id = $2', [postId, user_id]);
    if (!post) {
        res.status(404);
        throw new Error('Post not found or user not authorized.');
    }

    // Delete the post
    await db.none('DELETE FROM community_post WHERE post_id = $1', [postId]);
    res.status(204).send();
});

export const voteOnPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { vote_type } = req.body;
    const user_id = req.user.user_id;
    const existingVote = await db.oneOrNone('SELECT * FROM community_post_votes WHERE user_id = $1 AND post_id = $2', [user_id, postId]);
    if (existingVote) {
        if (vote_type === null || existingVote.vote_type === vote_type) {
            await db.none('DELETE FROM community_post_votes WHERE user_id = $1 AND post_id = $2', [user_id, postId]);
        } else {
            await db.none('UPDATE community_post_votes SET vote_type = $1 WHERE user_id = $2 AND post_id = $3', [vote_type, user_id, postId]);
        }
    } else if (vote_type !== null) {
        await db.none('INSERT INTO community_post_votes (user_id, post_id, vote_type) VALUES ($1, $2, $3)', [user_id, postId, vote_type]);
    }
    res.status(200).json({ success: true, message: 'Vote recorded.' });
});

export const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const query = `
        SELECT c.*, json_build_object('user_id', u.user_id, 'username', u.username, 'profile_picture_url', u.profile_picture_url) as user
        FROM comment c JOIN user_profiles u ON c.user_id = u.user_id
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
    
    // ✅ FIX: The INSERT statement now includes gen_random_uuid() to create the ID.
    const newComment = await db.one(
        `INSERT INTO comment (comment_id, post_id, user_id, content) 
         VALUES (gen_random_uuid(), $1, $2, $3) 
         RETURNING *`, 
        [postId, user_id, content.trim()]
    );
    
    const createdComment = await db.one(`
        SELECT c.*, json_build_object('user_id', u.user_id, 'username', u.username, 'profile_picture_url', u.profile_picture_url) as user 
        FROM comment c JOIN user_profiles u ON c.user_id = u.user_id WHERE c.comment_id = $1`, 
        [newComment.comment_id]
    );
    res.status(201).json(createdComment);
});