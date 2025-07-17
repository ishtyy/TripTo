import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  voteOnPost,
  getPostComments,
  createCommentOnPost,
} from '../controllers/communityPostController.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get posts for a community
router.route('/').get( getPosts);

// Create a new post
router.route('/').post(checkJwtMiddleware, createPost);

// Routes for a single post
router.route('/:postId')
  .get( getPostById)
  .put(checkJwtMiddleware, updatePost)
  .delete(checkJwtMiddleware, deletePost);

// Route for voting on a post
router.route('/:postId/vote').post(checkJwtMiddleware, voteOnPost);

// ✅ FIX: Routes for getting and creating comments for a specific post
router.route('/:postId/comments')
    .get(getPostComments)
    .post(checkJwtMiddleware, createCommentOnPost);

export default router;