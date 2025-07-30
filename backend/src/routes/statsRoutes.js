import express from 'express';
import { getPlatformStats, getActiveUsers } from '../controllers/statsController.js';

const router = express.Router();

// GET /api/stats - Get platform statistics
router.get('/', getPlatformStats);

// GET /api/stats/active-users - Get currently active users
router.get('/active-users', getActiveUsers);

export default router;
