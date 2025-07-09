// src/controllers/communityController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getAllCommunities = asyncHandler(async (req, res) => {
    const { limit, q } = req.query;
    let query = `
    SELECT
      c.community_id, c.community_name, c.description, c.created_at, c.location_id,
      json_build_object('location_name', l.location_name, 'country', l.country) AS location
    FROM community c
    LEFT JOIN locations l ON c.location_id = l.location_id
  `;

    const params = [];
    const conditions = [];

    if (q) {
        params.push(`%${q}%`);
        conditions.push(`(c.community_name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY c.created_at DESC`;
    if (limit) {
        params.push(limit);
        query += ` LIMIT $${params.length}`;
    }

    const rows = await db.any(query, params);
    res.json({ communities: rows });
});

export const getCommunityById = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    const query = `
    SELECT
      c.community_id, c.community_name, c.description, c.created_at, c.location_id,
      json_build_object('location_name', l.location_name, 'country', l.country) AS location
    FROM community c
    LEFT JOIN locations l ON c.location_id = l.location_id
    WHERE c.community_id = $1
  `;

    const rows = await db.any(query, [communityId]);
    if (!rows.length) {
        res.status(404);
        throw new Error('Community not found.');
    }

    res.json({ community: rows[0] });
});

export const createCommunity = asyncHandler(async (req, res) => {
    const { community_name, description, location_id } = req.body;
    const creator_user_id = req.userId;

    if (!community_name || !description || !location_id) {
        res.status(400);
        throw new Error('Community name, description, and location_id are required.');
    }

    const now = new Date();

    const result = await db.tx(async t => {
        const community = await t.one(
            `INSERT INTO community (community_name, description, location_id, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [community_name.trim(), description.trim(), location_id, now]
        );

        await t.none(
            `INSERT INTO community_membership (community_id, user_id, role, joined_at)
       VALUES ($1, $2, 'admin', $3)`,
            [community.community_id, creator_user_id, now]
        );

        const location = await t.oneOrNone(
            'SELECT location_name, country FROM locations WHERE location_id = $1',
            [community.location_id]
        );

        return { ...community, location };
    });

    res.status(201).json({ community: result });
});

export const getMembershipStatus = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.userId;

    const row = await db.oneOrNone(
        'SELECT user_id, community_id, role, joined_at FROM community_membership WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
    );

    if (row) {
        res.json({ isMember: true, role: row.role, details: row });
    } else {
        res.json({ isMember: false, role: null });
    }
});

export const joinCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.userId;

    const exists = await db.oneOrNone(
        'SELECT user_id FROM community_membership WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
    );

    if (exists) {
        res.status(409);
        throw new Error('User is already a member of this community.');
    }

    const now = new Date();
    const membership = await db.one(
        `INSERT INTO community_membership (community_id, user_id, role, joined_at)
     VALUES ($1, $2, 'member', $3)
     RETURNING *`,
        [communityId, userId, now]
    );

    res.status(201).json({ message: 'Successfully joined community.', membership });
});

export const leaveCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.userId;

    const result = await db.result(
        'DELETE FROM community_membership WHERE community_id = $1 AND user_id = $2',
        [communityId, userId]
    );

    if (result.rowCount === 0) {
        res.status(404);
        throw new Error('Membership not found.');
    }

    res.status(200).json({ message: 'Successfully left community.' });
});

export const getCommunityMembers = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    const rows = await db.any(
        `SELECT cm.user_id, cm.role, cm.joined_at,
            json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url) AS user_profile
     FROM community_membership cm
     JOIN user_profiles up ON cm.user_id = up.user_id
     WHERE cm.community_id = $1
     ORDER BY cm.joined_at ASC`,
        [communityId]
    );

    res.json({ members: rows });
});
