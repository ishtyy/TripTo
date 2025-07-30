import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load hotels from JSON file
const loadHotelsFromJSON = () => {
    try {
        const hotelsPath = path.join(__dirname, '../data/hotels.json');
        const hotelsData = fs.readFileSync(hotelsPath, 'utf8');
        return JSON.parse(hotelsData);
    } catch (error) {
        console.error('Error loading hotels data:', error);
        return [];
    }
};

// Get hotels with search functionality
export const getHotels = asyncHandler(async (req, res) => {
    try {
        const { destination, checkin, checkout, guests, limit = 20 } = req.query;
        let hotels = loadHotelsFromJSON();

        // Filter by destination if provided
        if (destination) {
            hotels = hotels.filter(hotel =>
                hotel.location.toLowerCase().includes(destination.toLowerCase())
            );
        }

        // Limit results
        hotels = hotels.slice(0, parseInt(limit));

        res.json({
            hotels,
            total: hotels.length,
            filters: { destination, checkin, checkout, guests }
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
});

// Get hotel details by ID
export const getHotelDetails = asyncHandler(async (req, res) => {
    try {
        const { hotelId } = req.params;
        const hotels = loadHotelsFromJSON();
        const hotel = hotels.find(h => h.id.toString() === hotelId.toString());

        if (!hotel) {
            res.status(404).json({ error: 'Hotel not found' });
            return;
        }

        res.json({ hotel });
    } catch (error) {
        console.error('Error fetching hotel details:', error);
        res.status(500).json({ error: 'Failed to fetch hotel details' });
    }
});

// Get popular hotels
export const getPopularHotels = asyncHandler(async (req, res) => {
    try {
        const hotels = loadHotelsFromJSON();

        // Sort by rating and limit to top 6
        const popularHotels = hotels
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        res.json({ hotels: popularHotels });
    } catch (error) {
        console.error('Error fetching popular hotels:', error);
        res.status(500).json({ error: 'Failed to fetch popular hotels' });
    }
});

export const bookHotelRoom = asyncHandler(async (req, res) => {
    const { hotel_id, checkin_date, checkout_date, guests, total_amount, special_requests } = req.body;
    const userId = req.user.user_id;

    // Validate hotel exists
    const hotels = loadHotelsFromJSON();
    const hotel = hotels.find(h => h.id.toString() === hotel_id.toString());

    if (!hotel) {
        res.status(404).json({ error: 'Hotel not found' });
        return;
    }

    // Handle missing dates with defaults
    let finalCheckinDate = checkin_date;
    let finalCheckoutDate = checkout_date;

    if (!checkin_date || checkin_date === '') {
        finalCheckinDate = new Date().toISOString().split('T')[0];
    }
    if (!checkout_date || checkout_date === '') {
        finalCheckoutDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    try {
        // First, insert or get the hotel in the database
        let dbHotel = await db.oneOrNone(`
            SELECT hotel_id, hotel_name FROM hotels 
            WHERE hotel_name = $1
        `, [hotel.name]);

        if (!dbHotel) {
            // Hotel doesn't exist, create it
            dbHotel = await db.one(`
                INSERT INTO hotels (
                    hotel_name, location_id, address, star_rating, 
                    description, amenities, contact_info, is_active
                ) VALUES (
                    $1, 
                    (SELECT location_id FROM locations LIMIT 1),
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    true
                )
                RETURNING hotel_id, hotel_name
            `, [
                hotel.name,
                hotel.location || 'Address not specified',
                Math.floor(hotel.rating) || 4,
                hotel.description || `Beautiful ${hotel.name} with excellent amenities`,
                JSON.stringify(hotel.amenities || ['wifi', 'parking']),
                JSON.stringify({ phone: 'Contact hotel directly', email: 'info@hotel.com' })
            ]);
        }
        // Create a default room for this hotel
        let dbRoom = await db.oneOrNone(`
            SELECT room_id FROM hotel_rooms 
            WHERE hotel_id = $1 AND room_type = 'Standard Room'
            LIMIT 1
        `, [dbHotel.hotel_id]);

        if (!dbRoom) {
            // Room doesn't exist, create it
            dbRoom = await db.one(`
                INSERT INTO hotel_rooms (
                    hotel_id, room_type, bed_type, capacity, base_price,
                    room_size_sqm, amenities, is_available
                ) VALUES (
                    $1, 'Standard Room', 'Double', $2, $3, 25, 
                    $4, true
                )
                RETURNING room_id
            `, [
                dbHotel.hotel_id,
                guests || 2,
                hotel.price_per_night || 100,
                JSON.stringify(['wifi', 'tv', 'ac'])
            ]);
        }

        // If room already exists, get it
                // Use the room_id we found or created
        const roomId = dbRoom.room_id;

        // Create the main booking record
        const bookingRes = await db.one(`
            INSERT INTO booking (user_id, travel_date, status)
            VALUES ($1, $2, 'approved')
            RETURNING booking_id, status, booked_at
        `, [userId, finalCheckinDate]);

        // Create the hotel-specific booking record with proper foreign keys
        const hotelBooking = await db.one(`
            INSERT INTO hotel_bookings (
                booking_id, hotel_id, room_id, check_in_date, check_out_date,
                guest_count, special_requests
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            bookingRes.booking_id,
            dbHotel.hotel_id,
            roomId,
            finalCheckinDate,
            finalCheckoutDate,
            guests || 1,
            special_requests || 'Standard booking'
        ]);

        const result = {
            booking_id: bookingRes.booking_id,
            hotel_booking_id: hotelBooking.booking_id,
            hotel_id: hotel_id, // Original JSON hotel ID for frontend
            db_hotel_id: dbHotel.hotel_id, // Database hotel ID
            hotel_name: hotel.name,
            hotel_location: hotel.location,
            status: bookingRes.status,
            booked_at: bookingRes.booked_at,
            checkin_date: finalCheckinDate,
            checkout_date: finalCheckoutDate,
            guests: guests || 1,
            total_amount: total_amount || hotel.price_per_night,
            special_requests: special_requests || '',
            nights: Math.ceil((new Date(finalCheckoutDate) - new Date(finalCheckinDate)) / (1000 * 60 * 60 * 24))
        };

        res.status(201).json({
            message: 'Hotel booked successfully',
            booking: result
        });
    } catch (error) {
        console.error('Error booking hotel:', error);
        res.status(500).json({ error: error.message || 'Failed to book hotel' });
    }
});
