import express from 'express';
import {
  createBooking,
  getBookingById,
  getBookingsByUser,
  getAllBookings,
  getOrCreateItinerary,
  addFlightToItinerary,
  getMyBookingHistory // ✅ FIX: This function is now correctly imported
} from '../controllers/bookingController.js';

import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Itinerary Routes
router.route('/itinerary').get(checkJwtMiddleware, getOrCreateItinerary);
router.route('/itinerary/add').post(checkJwtMiddleware, addFlightToItinerary);

// Main Booking Routes
router.route('/').post(checkJwtMiddleware, createBooking);

// Route for a user to get their own booking history
router.route('/my-history').get(checkJwtMiddleware, getMyBookingHistory);

// Admin route to get all bookings
router.route('/admin/all').get(checkJwtMiddleware, requireRole('admin'), getAllBookings);

// Other routes
router.route('/:id').get(checkJwtMiddleware, getBookingById);
router.route('/user/:userId').get(checkJwtMiddleware, getBookingsByUser);

export default router;