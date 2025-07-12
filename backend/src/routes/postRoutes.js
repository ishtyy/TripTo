import express from 'express';
import {
    getAllPosts,
    getPostById,
    createPost,
    voteOnPost,
    cascadePost,
    getPostComments,      // 1. Import the new functions
    createCommentOnPost
} from '../controllers/postController.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Your existing routes ---
router.route('/').get(getAllPosts).post(checkJwtMiddleware, createPost);
router.route('/:postId').get(getPostById);
router.route('/:id/vote').post(checkJwtMiddleware, voteOnPost);
router.route('/:postId/cascade').post(checkJwtMiddleware, cascadePost);

// ✅ 2. NEW: Routes for fetching and creating comments
router.route('/:postId/comments')
    .get(getPostComments)
    .post(checkJwtMiddleware, createCommentOnPost);

export default router;
