// src/routes/communityPostRoutes.js
import express from 'express';
import {
  getCommunityPosts,
  createCommunityPost
} from '../controllers/communityPostController.js';

const router = express.Router();

router.get('/', getCommunityPosts);
router.post('/', ...createCommunityPost);

export default router;
