// src/routes/authRoutes.js
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/authRateLimiter.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

export default router;
