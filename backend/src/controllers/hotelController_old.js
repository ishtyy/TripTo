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

// Get all hotels with filters
export const getHotels = asyncHandler(async (req, res) => {
    const { location, checkin, checkout, guests, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE h.is_active = true';
    const queryParams = [];
    let paramIndex = 1;

    if (location) {
        whereClause += ` AND (l.location_name ILIKE $${paramIndex} OR l.country ILIKE $${paramIndex})`;
        queryParams.push(`%${location}%`);
        paramIndex++;
    }

    const query = `
        SELECT 
            h.hotel_id,
            h.hotel_name,
            h.address,
            h.star_rating,
            h.description,
            h.amenities,
            h.check_in_time,
            h.check_out_time,
            l.location_name,
            l.country,
            l.latitude,
            l.longitude,
            MIN(hr.base_price) as min_price,
            MAX(hr.base_price) as max_price,
            COUNT(hr.room_id) as total_rooms
        FROM hotels h
        JOIN locations l ON h.location_id = l.location_id
        LEFT JOIN hotel_rooms hr ON h.hotel_id = hr.hotel_id AND hr.is_available = true
        ${whereClause}
        GROUP BY h.hotel_id, h.hotel_name, h.address, h.star_rating, h.description, 
                 h.amenities, h.check_in_time, h.check_out_time, l.location_name, 
                 l.country, l.latitude, l.longitude
        ORDER BY h.star_rating DESC, h.hotel_name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    try {
        const hotels = await db.any(query, queryParams);
        
        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(DISTINCT h.hotel_id) as total
            FROM hotels h
            JOIN locations l ON h.location_id = l.location_id
            ${whereClause}
        `;
        
        const countResult = await db.one(countQuery, queryParams.slice(0, -2));
        
        res.json({
            hotels,
            pagination: {
                total: parseInt(countResult.total),
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500);
        throw new Error('Failed to fetch hotels');
    }
});

// Get hotel details with rooms
export const getHotelDetails = asyncHandler(async (req, res) => {
    const { hotelId } = req.params;
    const { checkin, checkout, guests } = req.query;

    try {
        // Get hotel details
        const hotel = await db.one(`
            SELECT 
                h.*,
                l.location_name,
                l.country,
                l.latitude,
                l.longitude
            FROM hotels h
            JOIN locations l ON h.location_id = l.location_id
            WHERE h.hotel_id = $1 AND h.is_active = true
        `, [hotelId]);

        // Get available rooms
        let roomQuery = `
            SELECT 
                hr.*,
                CASE 
                    WHEN $2::date IS NOT NULL AND $3::date IS NOT NULL THEN
                        NOT EXISTS (
                            SELECT 1 FROM hotel_bookings hb 
                            WHERE hb.room_id = hr.room_id 
                            AND hb.check_in_date < $3::date 
                            AND hb.check_out_date > $2::date
                        )
                    ELSE hr.is_available
                END as is_available_for_dates
            FROM hotel_rooms hr
            WHERE hr.hotel_id = $1 AND hr.is_available = true
        `;

        const rooms = await db.any(roomQuery, [hotelId, checkin, checkout]);

        res.json({
            hotel,
            rooms
        });
    } catch (error) {
        console.error('Error fetching hotel details:', error);
        if (error.message.includes('No data returned')) {
            res.status(404);
            throw new Error('Hotel not found');
        }
        res.status(500);
        throw new Error('Failed to fetch hotel details');
    }
});

// Book a hotel room
export const bookHotelRoom = asyncHandler(async (req, res) => {
    const { hotel_id, room_id, checkin_date, checkout_date, guests, special_requests, total_amount } = req.body;
    const userId = req.user.user_id;

    try {
        // Simplified booking logic
        const booking = await db.one(`
            INSERT INTO hotel_bookings (
                user_id, hotel_id, check_in_date, check_out_date, 
                guests, total_amount, special_requests, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', NOW())
            RETURNING *
        `, [userId, hotel_id, checkin_date, checkout_date, guests, total_amount, special_requests]);

        res.status(201).json({
            message: 'Hotel booked successfully',
            booking
        });
    } catch (error) {
        console.error('Error booking hotel:', error);
        res.status(400);
        throw new Error(error.message || 'Failed to book hotel');
    }
});

// Get popular hotels
export const getPopularHotels = asyncHandler(async (req, res) => {
    try {
        const hotels = await db.any(`
            SELECT 
                h.id,
                h.name,
                h.location,
                h.rating,
                h.price_per_night,
                h.amenities,
                COUNT(hb.id) as booking_count
            FROM hotels h
            LEFT JOIN hotel_bookings hb ON h.id = hb.hotel_id
            GROUP BY h.id, h.name, h.location, h.rating, h.price_per_night, h.amenities
            ORDER BY booking_count DESC, h.rating DESC
            LIMIT 6
        `);

        res.json({ hotels });
    } catch (error) {
        console.error('Error fetching popular hotels:', error);
        res.status(500);
        throw new Error('Failed to fetch popular hotels');
    }
});
