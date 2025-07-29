import express from 'express';
import { updateBookingStatus, getBookingDetails, getFlightBookings, getHotelBookings, getBookings } from '../../controllers/adminController.js';
import db from '../../config/db.js';

const router = express.Router();

// Note: Auth middleware already applied at parent router level in adminRoutes.js
router.route('/').get(getBookings);
// Specific routes MUST come before parameterized routes
router.route('/flights').get(getFlightBookings);
router.route('/hotels').get(getHotelBookings);
// Parameterized routes come after specific ones
router.route('/:bookingId').get(getBookingDetails);
router.route('/:bookingId/status').put(updateBookingStatus);
router.route('/:bookingId').delete(async (req, res) => {
    // Delete booking endpoint
    const { bookingId } = req.params;
    try {
        // First check if booking exists
        const booking = await db.oneOrNone('SELECT booking_id FROM booking WHERE booking_id = $1', [bookingId]);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        // Delete the booking
        await db.none('DELETE FROM booking WHERE booking_id = $1', [bookingId]);
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Failed to delete booking' });
    }
});

export default router;