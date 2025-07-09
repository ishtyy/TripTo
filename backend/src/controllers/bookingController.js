// src/controllers/bookingController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
    const { user_id, travel_date, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error('Booking must include at least one item.');
    }

    const result = await db.one(
        `INSERT INTO booking (user_id, travel_date)
   VALUES ($1, $2)
   RETURNING booking_id`,
        [user_id, travel_date]
    );
    const bookingId = result.booking_id;

    // 2. Insert each booking item
    const itemQueries = items.map(({ bookable_item_id, quantity, price_at_booking }) => {
        return db.none(
            `INSERT INTO booking_item (booking_id, bookable_item_id, quantity, price_at_booking)
       VALUES ($1, $2, $3, $4)`,
            [bookingId, bookable_item_id, quantity, price_at_booking]
        );
    });

    await Promise.all(itemQueries);

    res.status(201).json({ success: true, booking_id: bookingId });
});

// GET /api/bookings/:id
export const getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const booking = await db.oneOrNone(
        `SELECT * FROM booking WHERE booking_id = $1`,
        [id]
    );

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const items = await db.any(
        `SELECT bi.*, bki.quantity, bki.price_at_booking
     FROM booking_item bki
     JOIN bookable_item bi ON bki.bookable_item_id = bi.bookable_item_id
     WHERE bki.booking_id = $1`,
        [id]
    );

    res.json({ ...booking, items });
});

// GET /api/bookings/user/:userId
export const getBookingsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const bookings = await db.any(
        `SELECT * FROM booking WHERE user_id = $1 ORDER BY booked_at DESC`,
        [userId]
    );

    res.json(bookings);
});

export const getAllBookings = asyncHandler(async (req, res) => {
    const allBookings = await db.any(
        `SELECT b.*, 
        u.username, 
        u.email
        FROM booking b
        JOIN user_profiles u ON b.user_id = u.user_id
        ORDER BY b.booked_at DESC`
    );

    res.json(allBookings);
});
