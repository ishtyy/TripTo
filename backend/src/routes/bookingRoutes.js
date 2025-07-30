import express from 'express';
import {
    createBooking,
    getBookingById,
    getBookingsByUser,
    getAllBookings,
    getOrCreateItinerary,
    addFlightToItinerary,
    getMyBookingHistory,
    removeFlightFromItinerary, // Export the new remove function
    updateItineraryItemDetails,
    getComprehensiveItinerary 
} from '../controllers/bookingController.js';

import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Itinerary Routes
router.route('/itinerary').get(checkJwtMiddleware, getOrCreateItinerary);
router.route('/itinerary/add').post(checkJwtMiddleware, addFlightToItinerary);
router.route('/itinerary/remove').post(checkJwtMiddleware, removeFlightFromItinerary);
router.route('/itinerary/update-details').post(checkJwtMiddleware, updateItineraryItemDetails); // NEW: Route for updating itinerary item details

// Main Booking Routes
router.route('/').post(checkJwtMiddleware, createBooking);

// Route for a user to get their own booking history
router.route('/my-history').get(checkJwtMiddleware, getMyBookingHistory);

// Admin route to get all bookings
router.route('/admin/all').get(checkJwtMiddleware, requireRole('admin'), getAllBookings);

// Other routes
router.route('/:id').get(checkJwtMiddleware, getBookingById);
router.route('/user/:userId').get(checkJwtMiddleware, getBookingsByUser);
router.get('/itinerary/comprehensive', checkJwtMiddleware, getComprehensiveItinerary);



export default router;