import express from "express";
import db from "../config/db.js";
import { checkJwtMiddleware } from "../middleware/authMiddleware.js";
import { getTrendingTags, addReactionToPost, incrementViewCount, postSelectQuery, getPostsWithUserVote } from '../controllers/postController.js';

const router = express.Router();

// Specific routes first (before parameterized routes)
router.get('/trending-tags', getTrendingTags);
router.get('/following', checkJwtMiddleware, async (req, res, next) => {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.user_id;
    
    try {
        const query = `
            ${postSelectQuery}
            INNER JOIN followers f ON p.author_id = f.followed_id
            WHERE f.follower_id = $1
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const posts = await getPostsWithUserVote(query, [userId, limit, offset], req);
        res.json({ posts: posts || [] });
    } catch (err) {
        next(err);
    }
});
router.get('/by-tag/:tagName', async (req, res, next) => {
    const { tagName } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    try {
        const query = `
            ${postSelectQuery}
            INNER JOIN blog_post_tags bpt ON p.post_id = bpt.post_id
            INNER JOIN blog_tags bt ON bpt.tag_id = bt.tag_id
            WHERE LOWER(bt.tag_name) = LOWER($1)
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const posts = await getPostsWithUserVote(query, [tagName, limit, offset], req);
        res.json({ posts: posts || [], tag: tagName });
    } catch (err) {
        next(err);
    }
});

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

    const posts = await getPostsWithUserVote(query, params, req);
    res.json({ posts: posts || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/:postId", async (req, res, next) => {
    const { postId } = req.params;
    try {
        const query = `${postSelectQuery} WHERE p.post_id = $1`;
        const posts = await getPostsWithUserVote(query, [postId], req);
        if (posts.length === 0) return res.status(404).json({ error: "Post not found." });
        res.json({ post: posts[0] });
    } catch (err) {
        next(err);
    }
});

router.post("/:postId/vote", checkJwtMiddleware, async (req, res, next) => {
    const { postId } = req.params;
    const user_id = req.user.user_id;
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
    const user_id = req.user.user_id;
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
    const { title, content, location_id, tags = [] } = req.body;
    const author_id = req.user.user_id;

    if (!title || !content || !location_id) {
      return res.status(400).json({ error: "Title, content, and location_id are required." });
    }

    const result = await db.tx(async t => {
      const now = new Date();
      
      // Insert the post
      const insertQuery = `
        INSERT INTO blogpost (author_id, location_id, title, content, created_at, last_updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const post = await t.one(insertQuery, [author_id, location_id, title.trim(), content.trim(), now, now]);
      
      // Handle tags if provided
      if (tags && tags.length > 0) {
        try {
          // Create or find tags
          for (const tagName of tags.slice(0, 10)) { // Limit to 10 tags
            if (tagName.trim()) {
              // Try to insert tag or ignore if exists
              await t.none(`
                INSERT INTO blog_tags (tag_name, usage_count) 
                VALUES ($1, 1) 
                ON CONFLICT (tag_name) DO UPDATE SET usage_count = blog_tags.usage_count + 1
              `, [tagName.trim().toLowerCase()]);
              
              // Link tag to post
              await t.none(`
                INSERT INTO blog_post_tags (post_id, tag_id) 
                SELECT $1, tag_id FROM blog_tags WHERE tag_name = $2
                ON CONFLICT DO NOTHING
              `, [post.post_id, tagName.trim().toLowerCase()]);
            }
          }
        } catch (tagError) {
          console.log('Tags table not found, skipping tag processing:', tagError.message);
        }
      }
      
      // Get the complete post with user and location data
      const completePost = await t.one(`
        SELECT 
          p.*, 
          json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) as user_profile, 
          json_build_object('location_name', l.location_name, 'country', l.country) as location
        FROM blogpost p
        JOIN user_profiles up ON p.author_id = up.user_id
        JOIN locations l ON p.location_id = l.location_id
        WHERE p.post_id = $1
      `, [post.post_id]);
      
      return completePost;
    });
    
    res.status(201).json({ post: result });
  } catch (err) {
    next(err);
  }
});

// New routes
router.post('/:postId/react', checkJwtMiddleware, addReactionToPost);
router.post('/:postId/view', incrementViewCount);

// Get comments for a post
router.get("/:postId/comments", async (req, res, next) => {
    const { postId } = req.params;
    try {
        const query = `
            SELECT 
                bc.comment_id, bc.content, bc.created_at, bc.upvote_count, bc.downvote_count,
                json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) AS user
            FROM blog_comment bc
            LEFT JOIN user_profiles up ON bc.user_id = up.user_id
            WHERE bc.post_id = $1
            ORDER BY bc.created_at ASC
        `;
        const rows = await db.any(query, [postId]);
        res.json(rows || []);
    } catch (err) {
        next(err);
    }
});

// Add a comment to a post
router.post("/:postId/comments", checkJwtMiddleware, async (req, res, next) => {
    const { postId } = req.params;
    const user_id = req.user.user_id;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: "Comment content is required." });
    }

    try {
        const result = await db.tx(async t => {
            // Insert the comment
            const insertQuery = `
                INSERT INTO blog_comment (post_id, user_id, content, created_at)
                VALUES ($1, $2, $3, $4)
                RETURNING comment_id, content, created_at
            `;
            const commentResult = await t.one(insertQuery, [postId, user_id, content.trim(), new Date()]);
            
            // Get user profile for the response
            const userResult = await t.one('SELECT username, profile_picture_url FROM user_profiles WHERE user_id = $1', [user_id]);
            
            // Update comment count on the post
            await t.none('UPDATE blogpost SET comment_count = comment_count + 1 WHERE post_id = $1', [postId]);
            
            return {
                ...commentResult,
                user: userResult,
                upvote_count: 0,
                downvote_count: 0
            };
        });
        
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

export default router;