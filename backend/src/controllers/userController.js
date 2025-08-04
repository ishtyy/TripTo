import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * @desc    Search for users by username
 * @route   GET /api/users/search
 * @access  Public
 */
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
    const users = await db.any(query, [`%${q}%`]);
    res.json({ users });
});

/**
 * @desc    Get a user's profile, including follow status
 * @route   GET /api/users/:id
 * @access  Public (but follow status depends on being logged in)
 */
export const getUserById = asyncHandler(async (req, res) => {
    const { id: profileUserId } = req.params;
    // req.user is attached by your checkJwtMiddleware if the user is logged in
    const loggedInUserId = req.user?.user_id || null;

    // First check if the profile user exists and get their role
    const userCheck = await db.oneOrNone(`
        SELECT user_id, role FROM user_profiles WHERE user_id = $1
    `, [profileUserId]);

    if (!userCheck) {
        res.status(404);
        throw new Error('User not found.');
    }

    // Privacy control: If the profile is an admin and the requester is not an admin, deny access
    if (userCheck.role === 'admin' && req.user?.role !== 'admin') {
        res.status(403);
        throw new Error('Access denied. Cannot view admin profiles.');
    }

    // This query now includes a subquery to check the follow status
    const query = `
        SELECT 
            u.user_id, u.username, u.email, u.profile_picture_url, u.bio, u.created_at, u.role,
            (SELECT COUNT(*) FROM followers WHERE followed_id = u.user_id) AS followers_count,
            (SELECT COUNT(*) FROM followers WHERE follower_id = u.user_id) AS following_count,
            -- Check if a follow relationship exists from the logged-in user to this profile
            EXISTS(SELECT 1 FROM followers WHERE follower_id = $2 AND followed_id = $1) as is_following
        FROM user_profiles u
        WHERE u.user_id = $1
    `;
    
    const user = await db.oneOrNone(query, [profileUserId, loggedInUserId]);

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }
    
    // Don't expose admin role to non-admin users for security
    if (req.user?.role !== 'admin' && user.role === 'admin') {
        delete user.role;
    }
    
    res.json({ user });
});

/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private (requires login)
 */
export const followUser = asyncHandler(async (req, res) => {
    const followed_id = req.params.id;
    const follower_id = req.user.user_id;

    if (followed_id === follower_id) {
        res.status(400);
        throw new Error("You cannot follow yourself.");
    }
    
    // Use ON CONFLICT to safely handle cases where the follow relationship already exists
    await db.none(
        `INSERT INTO followers (follower_id, followed_id, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (follower_id, followed_id) DO NOTHING`,
        [follower_id, followed_id]
    );

    res.status(200).json({ message: 'User followed successfully' });
});

/**
 * @desc    Unfollow a user
 * @route   POST /api/users/:id/unfollow
 * @access  Private (requires login)
 */
export const unfollowUser = asyncHandler(async (req, res) => {
    const followed_id = req.params.id;
    const follower_id = req.user.user_id;

    await db.none(
        'DELETE FROM followers WHERE follower_id = $1 AND followed_id = $2',
        [follower_id, followed_id]
    );

    res.status(200).json({ message: 'User unfollowed successfully' });
});


// --- Your other existing user controller functions ---
export const updateUserProfile = asyncHandler(async (req, res) => {
    // ... your logic here
    res.json({ message: 'Profile updated successfully' });
});

export const getUserCommunities = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Get communities the user has joined
        const query = `
            SELECT 
                c.community_id,
                c.community_name,
                c.description,
                c.created_at,
                c.member_count,
                cm.joined_at,
                cm.role as member_role
            FROM community c
            INNER JOIN community_members cm ON c.community_id = cm.community_id
            WHERE cm.user_id = $1
            ORDER BY cm.joined_at DESC
        `;
        
        const communities = await db.manyOrNone(query, [userId]);
        res.json({ communities: communities || [] });
    } catch (error) {
        console.error('Error fetching user communities:', error);
        // Return empty array as fallback
        res.json({ communities: [] });
    }
});