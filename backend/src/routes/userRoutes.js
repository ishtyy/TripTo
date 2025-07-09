// src/routes/usersRoutes.js
import express from 'express';
import {
  searchUsers,
  getUserById,
  getUserCommunities
} from '../controllers/userController.js';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.get('/:userId/communities', ...getUserCommunities);

export default router;
