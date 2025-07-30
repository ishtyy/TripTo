import { Router } from 'express';
import db from '../config/db.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Get user settings
router.get('/users/settings', checkJwtMiddleware, async (req, res) => {
    try {
        const user = await db.oneOrNone(
            'SELECT * FROM user_profiles WHERE user_id = $1',
            [req.user.user_id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user data with default settings structure
        const settings = {
            username: user.username,
            email: user.email,
            profile_picture_url: user.profile_picture_url,
            bio: user.bio,
            privacy_settings: {
                profile_visibility: 'public',
                email_visibility: 'private',
                activity_visibility: 'friends'
            },
            notification_settings: {
                email_notifications: true,
                push_notifications: true,
                community_updates: true,
                booking_updates: true
            },
            theme_preferences: {
                theme: 'dark',
                language: 'en'
            }
        };

        res.json(settings);
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update user settings
router.put('/users/settings', checkJwtMiddleware, async (req, res) => {
    try {
        const updateData = {
            username: req.body.username,
            email: req.body.email,
            profile_picture_url: req.body.profile_picture_url,
            bio: req.body.bio
        };

        // Only update fields that exist in the database
        const user = await db.one(
            `UPDATE user_profiles SET 
                username = $1,
                email = $2,
                profile_picture_url = $3,
                bio = $4
             WHERE user_id = $5
             RETURNING *`,
            [
                updateData.username,
                updateData.email,
                updateData.profile_picture_url,
                updateData.bio,
                req.user.user_id
            ]
        );

        res.json({ message: 'Settings updated successfully', user });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Change password
router.post('/auth/change-password', checkJwtMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        res.json({ message: 'Password change functionality would be implemented here' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

export default router;
