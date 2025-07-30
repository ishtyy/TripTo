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

// Book hotel room
export const bookHotelRoom = asyncHandler(async (req, res) => {
    const { hotel_id, checkin_date, checkout_date, guests, total_amount, special_requests } = req.body;
    const userId = req.user.user_id;

    if (!checkin_date || checkin_date === '' || !checkout_date || checkout_date === '') {
        res.status(400).json({ error: 'Check-in and check-out dates are required' });
        return;
    }
    
    const hotels = loadHotelsFromJSON();
    const hotel = hotels.find(h => h.id.toString() === hotel_id.toString());

    if (!hotel) {
        res.status(404).json({ error: 'Hotel not found' });
        return;
    }

    try {
        // Create hotel booking record in database
        const booking = await db.one(`
            INSERT INTO hotel_bookings (
            user_id, hotel_id, check_in_date, check_out_date, 
            guests, total_amount, special_requests, status, created_at
        ) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, 'confirmed', NOW())
            RETURNING *
        `, [
            userId,
            hotel_id,
            checkin_date && checkin_date !== '' ? checkin_date : null,
            checkout_date && checkout_date !== '' ? checkout_date : null,
            guests,
            total_amount,
            special_requests
        ]);

        res.status(201).json({
            message: 'Hotel booked successfully',
            booking
        });
    } catch (error) {
        console.error('Error booking hotel:', error);
        res.status(500).json({ error: 'Failed to book hotel' });
    }
});
