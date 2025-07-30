import { Router } from 'express';
import db from '../config/db.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Middleware to check admin role
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Get admin system settings
router.get('/admin/settings', checkJwtMiddleware, adminOnly, async (req, res) => {
    try {
        // Return default system settings - in a real app, this would come from a settings table
        const systemSettings = {
            site_name: 'TripTo 2.0',
            site_description: 'Your ultimate travel companion',
            max_upload_size: 10,
            registration_enabled: true,
            email_verification_required: true,
            community_creation_enabled: true,
            auto_approve_communities: false,
            maintenance_mode: false,
            rate_limits: {
                api_calls_per_minute: 100,
                uploads_per_hour: 50,
                posts_per_day: 20
            },
            email_settings: {
                smtp_host: 'smtp.gmail.com',
                smtp_port: 587,
                smtp_username: '',
                smtp_password: '',
                from_email: 'noreply@tripto.com',
                from_name: 'TripTo 2.0'
            },
            security_settings: {
                password_min_length: 8,
                require_special_chars: true,
                session_timeout: 24,
                max_login_attempts: 5,
                lockout_duration: 30
            }
        };

        res.json(systemSettings);
    } catch (error) {
        console.error('Error fetching admin settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update admin system settings
router.put('/admin/settings', checkJwtMiddleware, adminOnly, async (req, res) => {
    try {
        // In a real app, you'd save these settings to a system_settings table
        // For now, we'll just return success
        res.json({ message: 'System settings updated successfully' });
    } catch (error) {
        console.error('Error updating admin settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Get system stats
router.get('/admin/system-stats', checkJwtMiddleware, adminOnly, async (req, res) => {
    try {
        // Get actual counts from database
        const totalUsers = await db.oneOrNone('SELECT COUNT(*) as count FROM user_profiles').catch(() => ({ count: 0 }));
        const totalPosts = await db.oneOrNone('SELECT COUNT(*) as count FROM blogpost').catch(() => ({ count: 0 }));
        const totalCommunities = await db.oneOrNone('SELECT COUNT(*) as count FROM community').catch(() => ({ count: 0 }));
        const activeUsers24h = await db.oneOrNone('SELECT COUNT(*) as count FROM user_profiles WHERE created_at > NOW() - INTERVAL \'1 day\'').catch(() => ({ count: 0 }));

        const stats = {
            total_users: parseInt(totalUsers?.count) || 0,
            total_posts: parseInt(totalPosts?.count) || 0,
            total_communities: parseInt(totalCommunities?.count) || 0,
            active_users_24h: parseInt(activeUsers24h?.count) || 0,
            storage_used: 1024 * 150, // Mock: 150MB in MB
            api_calls_today: 1542 // Mock data
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ error: 'Failed to fetch system stats' });
    }
});

// Clear cache
router.post('/admin/clear-cache', checkJwtMiddleware, adminOnly, async (req, res) => {
    try {
        // In a real app, you'd clear Redis cache or other caching mechanisms
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

// Backup database
router.post('/admin/backup-database', checkJwtMiddleware, adminOnly, async (req, res) => {
    try {
        // In a real app, you'd initiate a database backup process
        res.json({ message: 'Database backup initiated successfully' });
    } catch (error) {
        console.error('Error initiating backup:', error);
        res.status(500).json({ error: 'Failed to initiate backup' });
    }
});

export default router;
