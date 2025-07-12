import express from 'express';
// ✅ FIX: The import now works because the function is correctly exported
import { getAllBookings } from '../../controllers/bookingController.js';

const router = express.Router();

// This assumes you have authentication middleware for admin routes
// import { protect, admin } from '../../middleware/authMiddleware.js';

// For demo purposes, we'll use a placeholder middleware
const protectAdmin = (req, res, next) => next();

router.route('/').get(protectAdmin, getAllBookings);

export default router;