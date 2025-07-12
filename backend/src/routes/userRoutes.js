import express from 'express';
import {
    searchUsers,
    getUserById,
    updateUserProfile,
    getUserCommunities,
    followUser,
    unfollowUser
} from '../controllers/userController.js';

// Import your actual authentication middleware
import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.route('/search').get(searchUsers);

// This route is public, but the controller logic will change based on whether a user is logged in
router.route('/:id').get(checkJwtMiddleware, getUserById); 

// --- Protected Routes (Require a valid token) ---
router.route('/profile').put(checkJwtMiddleware, updateUserProfile);
router.route('/:userId/communities').get(checkJwtMiddleware, getUserCommunities);

// Follow and Unfollow routes are protected
router.route('/:id/follow').post(checkJwtMiddleware, followUser);
router.route('/:id/unfollow').post(checkJwtMiddleware, unfollowUser);

export default router;