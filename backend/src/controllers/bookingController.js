import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Updated: getOrCreateItinerary to use database
const getOrCreateItinerary = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Placeholder user ID

    let itinerary = await db.oneOrNone(
        `SELECT itinerary_id FROM itinerary WHERE user_id = $1 AND status = 'active'`,
        [userId]
    );

    if (!itinerary) {
        itinerary = await db.one(
            `INSERT INTO itinerary (user_id, status) VALUES ($1, 'active') RETURNING itinerary_id`,
            [userId]
        );
    }

    const flights = await db.any(
        `SELECT
            ii.item_id,
            ii.flight_details, -- This JSONB column stores the full flight object
            ii.bookable_item_id,
            bi.title,
            bi.description,
            bi.type,
            bi.price
         FROM itinerary_item ii
         JOIN bookable_item bi ON ii.bookable_item_id = bi.bookable_item_id
         WHERE ii.itinerary_id = $1
         ORDER BY ii.added_at ASC`,
        [itinerary.itinerary_id]
    );

    const cartFlights = flights.map(item => ({
        ...item.flight_details, // Spread the original flight object from DB
        id: item.bookable_item_id, // Ensure frontend flight object has 'id' matching bookable_item_id
    }));

    res.json({ itineraryId: itinerary.itinerary_id, flights: cartFlights });
});

// Updated: addFlightToItinerary to use database
const addFlightToItinerary = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const { flight } = req.body; // 'flight' is the full flight object from FlightSearch

    let itinerary = await db.oneOrNone(
        `SELECT itinerary_id FROM itinerary WHERE user_id = $1 AND status = 'active'`,
        [userId]
    );

    if (!itinerary) {
        itinerary = await db.one(
            `INSERT INTO itinerary (user_id, status) VALUES ($1, 'active') RETURNING itinerary_id`,
            [userId]
        );
    }

    let masterFlightRecord = await db.oneOrNone(
        `SELECT flight_id FROM flight WHERE flight_number = $1 AND departure_time = $2`,
        [flight.number, flight.legs[0].departure.scheduledTime]
    );

    let bookableItemId;
    let flightPrice = Math.floor(Math.random() * 500) + 200;

    if (!masterFlightRecord) {
        const originLoc = await db.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [flight.legs[0].departure.airport.iataCode]);
        const destLoc = await db.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [flight.legs[flight.legs.length - 1].arrival.airport.iataCode]);

        if (!originLoc) {
            throw new Error(`Location not found for flight ${flight.number}: Origin ${flight.legs[0].departure.airport.iataCode} or Destination ${flight.legs[flight.legs.length - 1].arrival.airport.iataCode}`);
        }
        if (!destLoc) {
            throw new Error(`Location not found for flight ${flight.number}: Destination ${flight.legs[flight.legs.length - 1].arrival.airport.iataCode}`);
        }

        const newBookableItem = await db.one(
            `INSERT INTO bookable_item (type, title, description, price, created_by)
             VALUES ('flight', $1, $2, $3, $4) RETURNING bookable_item_id`,
            [
                `${flight.airline.name} ${flight.number}`,
                `Flight from ${flight.legs[0].departure.airport.iataCode} to ${flight.legs[flight.legs.length - 1].arrival.airport.iataCode}`,
                flightPrice,
                userId
            ]
        );
        bookableItemId = newBookableItem.bookable_item_id;

        await db.none(
            `INSERT INTO flight (
                flight_id, airline, flight_number, origin_id, destination_id, departure_time, arrival_time,
                seat_number, gate, terminal, duration_minutes, flight_class
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                bookableItemId,
                flight.airline.name,
                flight.number,
                originLoc.location_id,
                destLoc.location_id,
                flight.legs[0].departure.scheduledTime,
                flight.legs[flight.legs.length - 1].arrival.scheduledTime,
                flight.seat_number || null,
                flight.gate || null,
                flight.terminal || null,
                flight.totalDurationMinutes,
                flight.flight_class || 'Economy'
            ]
        );
    } else {
        bookableItemId = masterFlightRecord.flight_id;
    }

    const existingItineraryItem = await db.oneOrNone(
        `SELECT item_id FROM itinerary_item WHERE itinerary_id = $1 AND bookable_item_id = $2`,
        [itinerary.itinerary_id, bookableItemId]
    );

    if (existingItineraryItem) {
        res.status(200).json({ message: 'Flight already in itinerary.', bookableItemId: bookableItemId, flight });
        return;
    }

    await db.one(
        `INSERT INTO itinerary_item (itinerary_id, bookable_item_id, flight_details) VALUES ($1, $2, $3) RETURNING item_id`,
        [itinerary.itinerary_id, bookableItemId, flight]
    );

    res.status(200).json({ message: 'Flight added to itinerary.', bookableItemId: bookableItemId, flight });
});

const removeFlightFromItinerary = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const { flightId } = req.body;

    const itinerary = await db.oneOrNone(
        `SELECT itinerary_id FROM itinerary WHERE user_id = $1 AND status = 'active'`,
        [userId]
    );

    if (!itinerary) {
        res.status(404); throw new Error('No active itinerary found for user.');
    }

    const result = await db.result(
        `DELETE FROM itinerary_item WHERE itinerary_id = $1 AND bookable_item_id = $2`,
        [itinerary.itinerary_id, flightId]
    );

    if (result.rowCount === 0) {
        res.status(404); throw new Error('Flight not found in itinerary.');
    }

    res.status(200).json({ message: 'Flight removed from itinerary.' });
});

// updateItineraryItemDetails (No changes needed here, it expects correct IDs)
const updateItineraryItemDetails = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const { itineraryId, bookableItemId, updatedFlightDetails } = req.body;

    const itinerary = await db.oneOrNone(
        `SELECT itinerary_id, user_id FROM itinerary WHERE itinerary_id = $1 AND user_id = $2 AND status = 'active'`,
        [itineraryId, userId]
    );

    if (!itinerary) {
        res.status(403); throw new Error('Unauthorized or itinerary not found.');
    }

    try {
        await db.none(
            `UPDATE itinerary_item
             SET flight_details = $1::jsonb
             WHERE itinerary_id = $2 AND bookable_item_id = $3`,
            [JSON.stringify(updatedFlightDetails), itineraryId, bookableItemId]
        );
        res.status(200).json({ message: 'Itinerary item details updated successfully.' });
    } catch (updateError) {
        console.error(`ERROR: updateItineraryItemDetails - Database UPDATE failed for bookableItemId ${bookableItemId}:`, updateError);
        res.status(500).json({ error: 'Failed to update itinerary item details in database.' });
    }
});


const createBooking = asyncHandler(async (req, res) => {
    const user_id = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const { flights } = req.body; // Only need flights now, as passenger/seat are in flight.flight_details

    if (!Array.isArray(flights) || flights.length === 0) {
        res.status(400); throw new Error('Booking must include at least one flight.');
    }

    try {
        const newBooking = await db.tx(async t => {
            const activeItinerary = await t.oneOrNone(
                `SELECT itinerary_id FROM itinerary WHERE user_id = $1 AND status = 'active'`,
                [user_id]
            );

            if (!activeItinerary) {
                throw new Error('No active itinerary found for booking creation.');
            }
            const activeItineraryId = activeItinerary.itinerary_id;


            const travel_date = flights[0].legs[0].departure.scheduledTime;

            const bookingRecord = await t.one(
                `INSERT INTO booking (user_id, travel_date, status) VALUES ($1, $2, 'pending') RETURNING booking_id, booked_at`,
                [user_id, travel_date]
            );
            const bookingId = bookingRecord.booking_id;

            const invoiceRecord = await t.one(
                `INSERT INTO invoice (booking_id, overall_status) VALUES ($1, 'unpaid') RETURNING invoice_id`,
                [bookingId]
            );
            const invoiceId = invoiceRecord.invoice_id;

            for (const flight of flights) {
                // FIX: Get passengerData and selectedSeat directly from the `flight` object in the payload
                const passengerForFlight = flight.passengerData || {};
                const seatForFlight = flight.selectedSeat || null;

                let masterFlightRecord = await t.oneOrNone(
                    `SELECT flight_id, seat_number, gate, terminal, flight_class, duration_minutes FROM flight WHERE flight_number = $1 AND departure_time = $2`,
                    [flight.number, flight.legs[0].departure.scheduledTime]
                );

                let currentFlightId;
                let flightPrice = Math.floor(Math.random() * 500) + 200; // This price should ideally come from bookable_item.price

                if (!masterFlightRecord) {
                    const masterFlightSeat = flight.seat_number || null;
                    const masterFlightGate = flight.gate || null;
                    const masterFlightTerminal = flight.terminal || null;
                    const masterFlightClass = flight.flight_class || 'Economy';

                    const originIata = flight.legs[0].departure.airport.iataCode;
                    const destIata = flight.legs[flight.legs.length - 1].arrival.airport.iataCode; // This refers to the main flight's destination

                    const originLoc = await t.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [originIata]);
                    const destLoc = await t.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [destIata]);

                    if (!originLoc) {
                        throw new Error(`Location not found for flight ${flight.number}: Origin '${originIata}'`);
                    }
                    if (!destLoc) {
                        throw new Error(`Location not found for flight ${flight.number}: Destination '${destIata}'`);
                    }

                    const newBookableItem = await t.one(
                        `INSERT INTO bookable_item (type, title, description, price, created_by)
                         VALUES ('flight', $1, $2, $3, $4)
                         RETURNING bookable_item_id`,
                        [
                            `${flight.airline.name} ${flight.number}`,
                            `Flight from ${originIata} to ${destIata}`,
                            flightPrice,
                            user_id
                        ]
                    );
                    currentFlightId = newBookableItem.bookable_item_id;

                    masterFlightRecord = await t.one(
                        `INSERT INTO flight (
                            flight_id, airline, flight_number, origin_id, destination_id, departure_time, arrival_time,
                            seat_number, gate, terminal, duration_minutes, flight_class
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        RETURNING flight_id, seat_number, gate, terminal, flight_class, duration_minutes`,
                        [
                            currentFlightId,
                            flight.airline.name,
                            flight.number,
                            originLoc.location_id,
                            destLoc.location_id,
                            flight.legs[0].departure.scheduledTime,
                            flight.legs[flight.legs.length - 1].arrival.scheduledTime,
                            flight.seat_number || null,
                            flight.gate || null,
                            flight.terminal || null,
                            flight.totalDurationMinutes,
                            flight.flight_class || 'Economy'
                        ]
                    );

                } else {
                    currentFlightId = masterFlightRecord.flight_id;
                    const existingBookableItem = await t.oneOrNone('SELECT price FROM bookable_item WHERE bookable_item_id = $1', [currentFlightId]);
                    if (existingBookableItem) flightPrice = existingBookableItem.price;
                }

                // 2. Insert into 'booking_item' (passenger details)
                await t.none(
                    `INSERT INTO booking_item (
                        booking_id, bookable_item_id, quantity, price_at_booking,
                        passenger_name, passenger_gender, passenger_type
                    ) VALUES ($1, $2, 1, $3, $4, $5, $6)`,
                    [
                        bookingId,
                        currentFlightId,
                        flightPrice,
                        `${passengerForFlight.firstName || ''} ${passengerForFlight.lastName || ''}`.trim(),
                        passengerForFlight.gender || null,
                        passengerForFlight.type || null
                    ]
                );

                // --- Invoice Item Creation ---
                await t.none(
                    `INSERT INTO invoice_item (invoice_id, bookable_item_id, base_price, final_price, payment_status)
                     VALUES ($1, $2, $3, $3, 'unpaid')`, // Set payment_status to 'unpaid'
                    [invoiceId, currentFlightId, flightPrice]
                );


                // 3. Insert into 'flight_segment' for each leg (for multi-leg flights/transits)
                for (const leg of flight.legs) {
                    const segmentOriginIata = leg.departure.airport.iataCode;
                    const segmentDestIata = leg.arrival.airport.iataCode; // This is correct for segment's destination

                    const originLoc = await t.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [segmentOriginIata]);
                    const destLoc = await t.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [segmentDestIata]); // Use segmentDestIata here

                    if (!originLoc) {
                        throw new Error(`Location not found for segment: Origin '${segmentOriginIata}'`);
                    }
                    if (!destLoc) {
                        throw new Error(`Location not found for segment: Destination '${segmentDestIata}'`); // Use segmentDestIata in error
                    }

                    await t.none(
                        `INSERT INTO flight_segment (
                            booking_id, bookable_item_id, segment_number,
                            origin_id, destination_id, departure_time, arrival_time,
                            airline, flight_number, seat_number, gate, terminal, flight_class,
                            is_transit, transit_duration_minutes
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                        [
                            bookingId,
                            currentFlightId,
                            leg.segmentNumber || 1,
                            originLoc.location_id,
                            destLoc.location_id, // Use destLoc.location_id for segment's destination
                            leg.departure.scheduledTime,
                            leg.arrival.scheduledTime,
                            flight.airline.name,
                            flight.number,
                            leg.seat_number || seatForFlight,
                            leg.gate || null,
                            leg.terminal || null,
                            leg.flight_class || 'Economy',
                            leg.isTransit || false,
                            leg.transitDurationMinutes || null
                        ]
                    );
                }
            }

            // After successful booking creation, mark the active itinerary as 'booked'
            await t.none(
                `UPDATE itinerary SET status = 'booked' WHERE user_id = $1 AND status = 'active'`,
                [user_id]
            );

            return { booking_id: bookingId, booked_at: bookingRecord.booked_at, ...req.body };
        });

        res.status(201).json({ success: true, booking: newBooking });

    } catch (error) {
        console.error("ERROR: createBooking transaction failed:", error);
        const errorMessage = error.message.includes('Location not found') ? error.message : 'Failed to create booking due to a server error.';
        res.status(500).json({ error: errorMessage });
    }
});

const getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookingDetails = await db.oneOrNone(`
        SELECT
            b.booking_id,
            b.booked_at,
            b.travel_date,
            b.status,
            json_build_object(
                'user_id', up.user_id,
                'username', up.username,
                'email', up.email,
                'profile_picture_url', up.profile_picture_url
            ) AS user_info,
            json_agg(
                DISTINCT jsonb_build_object(
                    'item_id', bi.bookable_item_id,
                    'title', bi_main.title,
                    'description', bi_main.description,
                    'type', bi_main.type,
                    'price', bi.price_at_booking,
                    'quantity', bi.quantity,
                    -- Passenger details from booking_item
                    'passenger_name', bi.passenger_name,
                    'passenger_gender', bi.passenger_gender,
                    'passenger_type', bi.passenger_type,
                    -- Flight specific details from FLIGHT table (f)
                    'seat_number', f.seat_number,
                    'gate', f.gate,
                    'terminal', f.terminal,
                    'flight_class', f.flight_class,
                    'flight_info', CASE WHEN bi_main.type = 'flight' THEN
                        json_build_object(
                            'airline', f.airline,
                            'flight_number', f.flight_number,
                            'departure_time', f.departure_time,
                            'arrival_time', f.arrival_time,
                            'duration_minutes', f.duration_minutes,
                            'origin_name', origin_loc.location_name,
                            'origin_iata', origin_loc.iata_code,
                            'destination_name', dest_loc.location_name,
                            'destination_iata', dest_loc.iata_code
                        )
                    ELSE NULL END,
                    -- Flight segments (for transits)
                    'segments', CASE WHEN bi_main.type = 'flight' THEN
                        (
                            SELECT json_agg(
                                jsonb_build_object(
                                    'segment_id', fs.segment_id,
                                    'segment_number', fs.segment_number,
                                    'origin_name', fs_origin_loc.location_name,
                                    'origin_iata', fs_origin_loc.iata_code,
                                    'destination_name', fs_dest_loc.location_name,
                                    'destination_iata', fs_dest_loc.iata_code,
                                    'departure_time', fs.departure_time,
                                    'arrival_time', fs.arrival_time,
                                    'airline', fs.airline,
                                    'flight_number', fs.flight_number,
                                    'seat_number', fs.seat_number,
                                    'gate', fs.gate,
                                    'terminal', fs.terminal,
                                    'flight_class', fs.flight_class,
                                    'is_transit', fs.is_transit,
                                    'transit_duration_minutes', fs.transit_duration_minutes
                                ) ORDER BY fs.segment_number
                            )
                            FROM flight_segment fs
                            JOIN locations fs_origin_loc ON fs.origin_id = fs_origin_loc.location_id
                            JOIN locations fs_dest_loc ON fs.destination_id = fs_dest_loc.location_id
                            WHERE fs.booking_id = b.booking_id AND fs.bookable_item_id = bi.bookable_item_id
                        )
                    ELSE NULL END
                )
            ) FILTER (WHERE bi.booking_id IS NOT NULL) AS booked_items,
            json_build_object(
                'invoice_id', i.invoice_id,
                'issued_at', i.issued_at,
                'overall_status', i.overall_status,
                'payments', (
                    SELECT json_agg(
                        jsonb_build_object(
                            'payment_id', p.payment_id,
                            'amount', p.amount,
                            'payment_date', p.payment_date,
                            'method', p.method,
                            'status', p.status
                        )
                    ) FILTER (WHERE p.payment_id IS NOT NULL)
                    FROM invoice_item ii_pay
                    LEFT JOIN payment p ON p.invoice_item_id = ii_pay.invoice_item_id
                    WHERE ii_pay.invoice_id = i.invoice_id
                ),
                'invoice_items_summary', (
                    SELECT json_agg(
                        jsonb_build_object(
                            'item_id', ii_summary.bookable_item_id,
                            'base_price', ii_summary.base_price,
                            'discount', ii_summary.discount,
                            'final_price', ii_summary.final_price,
                            'payment_status', ii_summary.payment_status
                        )
                    ) FILTER (WHERE ii_summary.invoice_item_id IS NOT NULL)
                    FROM invoice_item ii_summary
                    WHERE ii_summary.invoice_id = i.invoice_id
                )
            ) AS invoice_info
        FROM booking b
        JOIN user_profiles up ON b.user_id = up.user_id
        LEFT JOIN booking_item bi ON b.booking_id = bi.booking_id
        LEFT JOIN bookable_item bi_main ON bi.bookable_item_id = bi_main.bookable_item_id
        LEFT JOIN flight f ON bi_main.bookable_item_id = f.flight_id AND bi_main.type = 'flight'
        LEFT JOIN locations origin_loc ON f.origin_id = origin_loc.location_id
        LEFT JOIN locations dest_loc ON f.destination_id = dest_loc.location_id
        LEFT JOIN invoice i ON b.booking_id = i.booking_id
        WHERE b.booking_id = $1
        GROUP BY b.booking_id, up.user_id, i.invoice_id
    `, [id]);

    if (!bookingDetails) { res.status(404); throw new Error('Booking not found'); }
    res.json(bookingDetails);
});

const getBookingsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const bookings = await db.any(`
        SELECT b.booking_id, b.travel_date, b.status, b.booked_at,
               json_agg(json_build_object('title', bi_main.title, 'type', bi_main.type)) as items_summary
        FROM booking b
        JOIN booking_item bi ON b.booking_id = bi.booking_id
        JOIN bookable_item bi_main ON bi.bookable_item_id = bi_main.bookable_item_id
        WHERE b.user_id = $1
        GROUP BY b.booking_id
        ORDER BY b.booked_at DESC
    `, [userId]);
    res.json(bookings);
});

const getMyBookingHistory = asyncHandler(async (req, res) => {
    const userId = req.user?.user_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const bookings = await db.any(
        `SELECT b.booking_id, b.travel_date, b.status, b.booked_at,
                json_agg(json_build_object('title', bi.title, 'description', bi.description, 'type', bi.type)) as items
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

export {
    getOrCreateItinerary,
    addFlightToItinerary,
    removeFlightFromItinerary, // Export the new remove function
    updateItineraryItemDetails, // Export the new update function
    createBooking,
    getBookingById,
    getBookingsByUser,
    getMyBookingHistory,
    getAllBookings
};