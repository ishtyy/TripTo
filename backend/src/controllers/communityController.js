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
    const community = await db.oneOrNone(query, [communityId]);
    if (!community) {
        res.status(404);
        throw new Error('Community not found.');
    }
    res.json({ community });
});

export const createCommunity = asyncHandler(async (req, res) => {
    const { name, community_name, description, location_id, latitude, longitude } = req.body;
    // ✅ FIX: Using the correct user ID from the authentication middleware
    const creator_user_id = req.user.user_id;

    // Handle both old format (community_name, location_id) and new format (name, latitude, longitude)
    const communityName = community_name || name;
    const communityDescription = description || `Community for ${communityName}`;

    if (!communityName) {
        res.status(400);
        throw new Error('Community name is required.');
    }

    // If latitude/longitude provided, create location; otherwise use existing location_id
    if (latitude !== undefined && longitude !== undefined && !location_id) {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            res.status(400);
            throw new Error('Latitude and longitude must be valid numbers.');
        }
    } else if (!location_id) {
        res.status(400);
        throw new Error('Either location_id or latitude/longitude coordinates are required.');
    }

    const now = new Date();
    const result = await db.tx(async t => {
        let finalLocationId = location_id;
        
        // Create location if coordinates provided
        if (latitude !== undefined && longitude !== undefined && !location_id) {
            const locationResult = await t.one(
                `INSERT INTO locations (location_name, country, coordinates, description) 
                 VALUES ($1, $2, ST_GeogFromText($3), $4) RETURNING location_id`,
                [
                    `${communityName} Area`,
                    'Unknown', // Default country - can be enhanced with reverse geocoding
                    `SRID=4326;POINT(${longitude} ${latitude})`,
                    `Location for ${communityName} community`
                ]
            );
            finalLocationId = locationResult.location_id;
        }

        const community = await t.one(
            `INSERT INTO community (community_name, description, location_id, created_at) VALUES ($1, $2, $3, $4) RETURNING *`,
            [communityName.trim(), communityDescription.trim(), finalLocationId, now]
        );
        await t.none(
            `INSERT INTO community_membership (community_id, user_id, role, joined_at) VALUES ($1, $2, 'admin', $3)`,
            [community.community_id, creator_user_id, now]
        );
        const location = await t.oneOrNone('SELECT location_name, country FROM locations WHERE location_id = $1', [community.location_id]);
        return { ...community, location };
    });
    res.status(201).json({ community: result });
});

export const getMembershipStatus = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    // ✅ FIX: Using the correct user ID from the authentication middleware
    const userId = req.user.user_id;

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
    // ✅ FIX: Using the correct user ID from the authentication middleware
    const userId = req.user.user_id;

    // This query is now safe because of the UNIQUE constraint you added to the database.
    const query = `
        INSERT INTO community_membership (community_id, user_id, role, joined_at)
        VALUES ($1, $2, 'member', NOW())
        ON CONFLICT (user_id, community_id) DO NOTHING
    `;

    await db.none(query, [communityId, userId]);

    res.status(200).json({ message: 'Successfully joined community.' });
});

export const leaveCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    // ✅ FIX: Using the correct user ID from the authentication middleware
    const userId = req.user.user_id;

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

export const getCommunityDetails = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user.user_id;

    // A single, powerful query to get all details at once.
    const detailsQuery = `
        SELECT 
            c.*, 
            (SELECT COUNT(*) FROM community_membership WHERE community_id = c.community_id) as member_count,
            (SELECT EXISTS(SELECT 1 FROM community_membership WHERE community_id = c.community_id AND user_id = $2)) as is_member,
            (
                SELECT json_agg(json_build_object(
                    'user_id', up.user_id,
                    'role', cm.role,
                    'user_profile', json_build_object('username', up.username, 'profile_picture_url', up.profile_picture_url)
                ))
                FROM (
                    SELECT * FROM community_membership WHERE community_id = c.community_id ORDER BY joined_at ASC LIMIT 10
                ) cm
                JOIN user_profiles up ON cm.user_id = up.user_id
            ) as members
        FROM community c
        WHERE c.community_id = $1;
    `;

    const community = await db.oneOrNone(detailsQuery, [communityId, userId]);

    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }

    res.json(community);
});