import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// This is a placeholder for a real itinerary table/system.
// We will use the database as requested in the next step.
const itineraryStore = {};

const getOrCreateItinerary = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    if (!itineraryStore[userId]) {
        itineraryStore[userId] = { id: `itin_${new Date().getTime()}`, userId: userId, flights: [], createdAt: new Date().toISOString() };
    }
    res.json(itineraryStore[userId]);
});

const addFlightToItinerary = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const { flight } = req.body;
    if (!itineraryStore[userId]) {
        itineraryStore[userId] = { id: `itin_${new Date().getTime()}`, userId: userId, flights: [], createdAt: new Date().toISOString() };
    }
    itineraryStore[userId].flights.push(flight);
    res.status(200).json(itineraryStore[userId]);
});

const createBooking = asyncHandler(async (req, res) => {
    const user_id = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const { flights, passengers, seats } = req.body;

    if (!Array.isArray(flights) || flights.length === 0) {
        res.status(400); throw new Error('Booking must include at least one flight.');
    }
    if (!passengers || Object.keys(passengers).length === 0) {
        res.status(400); throw new Error('Booking must include passenger information.');
    }

    const newBooking = await db.tx(async t => {
        const bookingRecord = await t.one(
            `INSERT INTO booking (user_id, travel_date, status) VALUES ($1, $2, 'pending') RETURNING booking_id, booked_at`,
            [user_id, flights[0].legs[0].departure.scheduledTime]
        );
        const bookingId = bookingRecord.booking_id;

        const bookableItemPromises = flights.map(flight => {
            const passengerForFlight = passengers[flight.id] || {};
            const seatForFlight = seats[flight.id] || 'Any';
            const flightTitle = `${flight.airline.name} ${flight.number}`;
            const flightDescription = `Flight from ${flight.legs[0].departure.airport.iataCode} to ${flight.legs[flight.legs.length - 1].arrival.airport.iataCode}. Passenger: ${passengerForFlight.firstName} ${passengerForFlight.lastName}. Seat: ${seatForFlight}.`;
            const price = Math.floor(Math.random() * 500) + 200;

            return t.one(
                `INSERT INTO bookable_item (type, title, description, price, created_by) VALUES ('flight', $1, $2, $3, $4) RETURNING bookable_item_id, price`,
                [flightTitle, flightDescription, price, user_id]
            );
        });

        const createdBookableItems = await Promise.all(bookableItemPromises);

        const bookingItemPromises = createdBookableItems.map(item => {
            return t.none(
                `INSERT INTO booking_item (booking_id, bookable_item_id, quantity, price_at_booking) VALUES ($1, $2, 1, $3)`,
                [bookingId, item.bookable_item_id, item.price]
            );
        });

        await Promise.all(bookingItemPromises);
        
        return { booking_id: bookingId, booked_at: bookingRecord.booked_at, ...req.body };
    });
    
    delete itineraryStore[user_id];
    res.status(201).json({ success: true, booking: newBooking });
});

const getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await db.oneOrNone(`SELECT * FROM booking WHERE booking_id = $1`, [id]);
    if (!booking) { res.status(404); throw new Error('Booking not found'); }
    const items = await db.any(`SELECT bi.* FROM booking_item bki JOIN bookable_item bi ON bki.bookable_item_id = bi.bookable_item_id WHERE bki.booking_id = $1`, [id]);
    res.json({ ...booking, items });
});

const getBookingsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const bookings = await db.any(`SELECT * FROM booking WHERE user_id = $1 ORDER BY booked_at DESC`, [userId]);
    res.json(bookings);
});

const getMyBookingHistory = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const bookings = await db.any(
        `SELECT b.booking_id, b.travel_date, b.status, b.booked_at, 
                json_agg(json_build_object('title', bi.title, 'description', bi.description)) as items
         FROM booking b
         JOIN booking_item bki ON b.booking_id = bki.booking_id
         JOIN bookable_item bi ON bki.bookable_item_id = bi.bookable_item_id
         WHERE b.user_id = $1
         GROUP BY b.booking_id ORDER BY b.booked_at DESC`, [userId]
    );
    res.json(bookings);
});

const getAllBookings = asyncHandler(async (req, res) => {
    const allBookings = await db.any(
        `SELECT b.*, u.username, u.email 
         FROM booking b 
         JOIN user_profiles u ON b.user_id = u.user_id 
         ORDER BY b.booked_at DESC`
    );
    res.json(allBookings);
});

// ✅ FIX: All functions are now included in the export statement.
export {
    getOrCreateItinerary,
    addFlightToItinerary,
    createBooking,
    getBookingById,
    getBookingsByUser,
    getMyBookingHistory,
    getAllBookings
};
