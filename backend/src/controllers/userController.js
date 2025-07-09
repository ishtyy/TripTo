// src/controllers/userController.js
import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({ users: [] });
  }

  const query = `
      SELECT user_id, username, profile_picture_url 
      FROM user_profiles 
      WHERE username ILIKE $1 
      LIMIT 10
  `;
  const params = [`%${q}%`];
  const users = await db.any(query, params);

  res.json({ users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
      SELECT user_id, username, email, profile_picture_url, bio, created_at
      FROM user_profiles
      WHERE user_id = $1
  `;
  const user = await db.oneOrNone(query, [id]);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  res.json({ user });
});

export const getUserCommunities = [
  checkJwtMiddleware,
  asyncHandler(async (req, res) => {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId;

    if (requestedUserId !== authenticatedUserId) {
      res.status(403);
      throw new Error('Forbidden: You can only view your own joined communities.');
    }

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
        LEFT JOIN locations l ON c.location_id = l.location_id
        WHERE cm.user_id = $1
    `;
    const communities = await db.any(query, [requestedUserId]);

    res.json({ communities });
  }),
];
