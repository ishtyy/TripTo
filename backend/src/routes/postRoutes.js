// src/routes/postRoutes.js

import express from 'express';
import {
    getAllPosts,
    getPostById,
    createPost,
    votePost,
    cascadePost,
} from '../controllers/postController.js';

import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/posts
router.get('/', getAllPosts);

// GET /api/posts/:postId
router.get('/:postId', getPostById);

// POST /api/posts (create new post)
router.post('/', checkJwtMiddleware, requireRole('user'), createPost);

// POST /api/posts/:postId/vote
router.post('/:postId/vote', checkJwtMiddleware, requireRole('user'), votePost);

// POST /api/posts/:postId/cascade
router.post('/:postId/cascade', checkJwtMiddleware, requireRole('user'), cascadePost);

export default router;
