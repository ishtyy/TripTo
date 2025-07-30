import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Export for use in routes
export const postSelectQuery = `
    SELECT
        p.post_id, p.title, p.content, p.created_at, p.author_id, p.location_id,
        p.upvote_count, p.downvote_count, p.cascade_count, p.parent_post_id, p.comment_count, p.view_count,
        up.username, up.profile_picture_url,
        l.location_name, l.country
    FROM blogpost p
    LEFT JOIN user_profiles up ON p.author_id = up.user_id
    LEFT JOIN locations l ON p.location_id = l.location_id
`;

export const getPostsWithUserVote = async (query, params, req) => {
    const userId = req.user?.user_id || null;
    const posts = await db.any(query, params);
    
    // Transform the data to match expected format
    const transformedPosts = posts.map(post => ({
        post_id: post.post_id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        author_id: post.author_id,
        location_id: post.location_id,
        upvote_count: post.upvote_count || 0,
        downvote_count: post.downvote_count || 0,
        cascade_count: post.cascade_count || 0,
        parent_post_id: post.parent_post_id,
        comment_count: post.comment_count || 0,
        view_count: post.view_count || 0,
        user_profile: {
            username: post.username || 'Unknown',
            profile_picture_url: post.profile_picture_url,
        },
        location: post.location_name ? {
            location_name: post.location_name,
            country: post.country
        } : null,
        tags: [],
        reactions: []
    }));
    
    // Fetch tags for all posts
    if (transformedPosts.length > 0) {
        try {
            const postIds = transformedPosts.map(p => p.post_id);
            const tags = await db.any(`
                SELECT bpt.post_id, bt.tag_id, bt.tag_name, bt.color
                FROM blog_post_tags bpt
                JOIN blog_tags bt ON bpt.tag_id = bt.tag_id
                WHERE bpt.post_id = ANY($1::uuid[])
            `, [postIds]);
            
            // Group tags by post_id
            const tagsByPost = new Map();
            tags.forEach(tag => {
                if (!tagsByPost.has(tag.post_id)) {
                    tagsByPost.set(tag.post_id, []);
                }
                tagsByPost.get(tag.post_id).push({
                    tag_id: tag.tag_id,
                    tag_name: tag.tag_name,
                    color: tag.color
                });
            });
            
            // Add tags to posts
            transformedPosts.forEach(post => {
                post.tags = tagsByPost.get(post.post_id) || [];
            });
        } catch (error) {
            console.error('Tags table not found or error fetching tags:', error);
        }
    }
    
    if (userId && transformedPosts.length > 0) {
        const postIds = transformedPosts.map(p => p.post_id);
        try {
            const votes = await db.any('SELECT post_id, vote_type FROM blog_post_votes WHERE user_id = $1 AND post_id = ANY($2::uuid[])', [userId, postIds]);
            const voteMap = new Map(votes.map(v => [v.post_id, v.vote_type]));
            transformedPosts.forEach(p => { p.user_vote = voteMap.get(p.post_id) || null; });
        } catch (error) {
            console.error('error here', error);
        }
    }
    return transformedPosts;
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
        conditions.push(`(p.title ILIKE $${params.length} OR p.content ILIKE $${params.length})`);
    }

    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    
    query += ` ORDER BY p.created_at DESC`;
    
    if (limit) {
        params.push(limit);
        query += ` LIMIT $${params.length}`;
    }
    
    try {
        const posts = await getPostsWithUserVote(query, params, req);
        res.json({ posts: posts || [] });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

export const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    try {
        const post = await db.oneOrNone(`${postSelectQuery} WHERE p.post_id = $1`, [postId]);
        if (!post) { 
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        res.json({ post });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

export const createPost = asyncHandler(async (req, res) => {
    const { title, content, location_id } = req.body;
    const author_id = req.user.user_id;

    try {
        const post = await db.one(`
            INSERT INTO blogpost (title, content, author_id, location_id, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
        `, [title, content, author_id, location_id]);

        res.status(201).json({ post });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

export const voteOnPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { vote_type } = req.body;
    const user_id = req.user.user_id;

    try {
        // Simplified voting - just update counts directly
        if (vote_type === 1) {
            await db.none('UPDATE blogpost SET upvote_count = upvote_count + 1 WHERE post_id = $1', [postId]);
        } else if (vote_type === -1) {
            await db.none('UPDATE blogpost SET downvote_count = downvote_count + 1 WHERE post_id = $1', [postId]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error voting on post:', error);
        res.status(500).json({ error: 'Failed to vote on post' });
    }
});

// Get trending tags
export const getTrendingTags = asyncHandler(async (req, res) => {
    try {
        const tags = await db.any(`
            SELECT tag_id, tag_name, usage_count
            FROM blog_tags
            WHERE usage_count > 0
            ORDER BY usage_count DESC
            LIMIT 10
        `);
        res.json({ 
            tags: tags.map(tag => ({
                id: tag.tag_id,
                name: tag.tag_name,
                count: tag.usage_count || 0
            }))
        });
    } catch (error) {
        console.log('blog_tags table not found or empty');
        res.json({ tags: [] });
    }
});

// Add reaction to post
export const addReactionToPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { reaction_type } = req.body;
    const user_id = req.user.user_id;

    try {
        const existingReaction = await db.oneOrNone(
            'SELECT * FROM blog_post_reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3',
            [postId, user_id, reaction_type]
        );

        if (!existingReaction) {
            await db.none(
                'INSERT INTO blog_post_reactions (post_id, user_id, reaction_type, created_at) VALUES ($1, $2, $3, NOW())',
                [postId, user_id, reaction_type]
            );
        }

        res.json({ message: 'Reaction added successfully' });
    } catch (error) {
        console.log('blog_post_reactions table not found, simulating reaction');
        res.json({ message: 'Reaction simulated successfully' });
    }
});

// Increment view count
export const incrementViewCount = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    
    try {
        await db.none('UPDATE blogpost SET view_count = COALESCE(view_count, 0) + 1 WHERE post_id = $1', [postId]);
        res.json({ message: 'View count incremented' });
    } catch (error) {
        console.log('view_count column not found, simulating increment');
        res.json({ message: 'View count simulated' });
    }
});

// Cascade post (create a response/continuation post)
export const cascadePost = asyncHandler(async (req, res) => {
    const { title, content, location_id } = req.body;
    const { postId } = req.params;
    const author_id = req.user.user_id;

    try {
        const post = await db.one(`
            INSERT INTO blogpost (title, content, author_id, location_id, parent_post_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *
        `, [title, content, author_id, location_id, postId]);

        // Increment cascade count on parent post
        await db.none('UPDATE blogpost SET cascade_count = cascade_count + 1 WHERE post_id = $1', [postId]);

        res.status(201).json({ post });
    } catch (error) {
        console.error('Error creating cascade post:', error);
        res.status(500).json({ error: 'Failed to create cascade post' });
    }
});

// Get comments for a post
export const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    try {
        const comments = await db.any(`
            SELECT 
                bc.comment_id, bc.content, bc.created_at,
                json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user
            FROM blog_comment bc
            JOIN user_profiles up ON bc.author_id = up.user_id
            WHERE bc.post_id = $1
            ORDER BY bc.created_at ASC
        `, [postId]);

        res.json(comments);
    } catch (error) {
        console.log('blog_comment table not found, returning empty comments');
        res.json([]);
    }
});

// Create comment on post
export const createCommentOnPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const author_id = req.user.user_id;

    try {
        const comment = await db.one(`
            INSERT INTO blog_comment (post_id, author_id, content, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `, [postId, author_id, content]);

        // Increment comment count on post
        await db.none('UPDATE blogpost SET comment_count = comment_count + 1 WHERE post_id = $1', [postId]);

        // Get comment with user data
        const commentWithUser = await db.one(`
            SELECT 
                bc.comment_id, bc.content, bc.created_at,
                json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user
            FROM blog_comment bc
            JOIN user_profiles up ON bc.author_id = up.user_id
            WHERE bc.comment_id = $1
        `, [comment.comment_id]);

        res.status(201).json(commentWithUser);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});
