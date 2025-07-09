// src/controllers/communityPostController.js
import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

export const getCommunityPosts = asyncHandler(async (req, res) => {
  const { communityId } = req.query;

  if (!communityId) {
    res.status(400);
    throw new Error('Community ID is required.');
  }

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
      JOIN user_profiles up ON cp.user_id = up.user_id
      WHERE cp.community_id = $1
      ORDER BY cp.is_pinned DESC, cp.created_at DESC
  `;

  const posts = await db.any(query, [communityId]);
  res.json({ posts });
});

export const createCommunityPost = [
  checkJwtMiddleware,
  asyncHandler(async (req, res) => {
    const { community_id, title, content } = req.body;
    const user_id = req.userId;

    if (!community_id || !title?.trim() || !content?.trim()) {
      res.status(400);
      throw new Error('Community ID, title, and content are required.');
    }

    const isMember = await db.oneOrNone(
      'SELECT user_id FROM community_membership WHERE community_id = $1 AND user_id = $2',
      [community_id, user_id]
    );

    if (!isMember) {
      res.status(403);
      throw new Error('User is not a member of this community and cannot post.');
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
        JOIN user_profiles up ON np.user_id = up.user_id
    `;

    const post = await db.one(insertQuery, [
      community_id,
      user_id,
      title.trim(),
      content.trim(),
      new Date(),
    ]);

    if (!post?.post_id) {
      res.status(500);
      throw new Error('Community post creation failed to return the created post.');
    }

    res.status(201).json({ post });
  }),
];
