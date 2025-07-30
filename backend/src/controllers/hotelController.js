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
        const hotel = hotels.find(h => h.id === parseInt(hotelId));
        
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

    try {
        // For now, we'll handle JSON-based hotel bookings with a simple approach
        // Create just the main booking record and return success
        
        const bookingRes = await db.one(`
            INSERT INTO booking (user_id, travel_date, status)
            VALUES ($1, $2, 'pending')
            RETURNING booking_id, status, booked_at
        `, [userId, checkin_date]);
        
        // Since JSON hotels don't exist in our relational database,
        // we'll return a successful booking response with the booking ID
        // In a real system, you might store this in a separate JSON/NoSQL store
        
        const result = {
            booking_id: bookingRes.booking_id,
            hotel_id: hotel_id,
            status: bookingRes.status,
            booked_at: bookingRes.booked_at,
            checkin_date: checkin_date,
            checkout_date: checkout_date,
            guests: guests,
            total_amount: total_amount,
            special_requests: special_requests,
            message: 'Hotel booking request submitted successfully'
        };

        res.status(201).json({
            message: 'Hotel booking request submitted successfully',
            booking: result
        });
    } catch (error) {
        console.error('Error booking hotel:', error);
        res.status(500).json({ error: error.message || 'Failed to submit hotel booking' });
    }
});
