// Test script to add flight segments for existing flight bookings

import db from './src/config/db.js';

async function addTestFlightSegments() {
    try {
        console.log('Checking for existing flight bookings...');
        
        // Get all flight bookings without segments
        const flightBookings = await db.any(`
            SELECT DISTINCT 
                b.booking_id, 
                b.booked_at,
                bi_item.bookable_item_id,
                bi.title as flight_title,
                f.airline, 
                f.flight_number,
                f.origin_iata,
                f.destination_iata,
                f.departure_time,
                f.arrival_time,
                f.duration_minutes,
                ol.location_id as origin_location_id,
                dl.location_id as dest_location_id
            FROM booking b
            JOIN booking_item bi_item ON b.booking_id = bi_item.booking_id
            JOIN bookable_item bi ON bi_item.bookable_item_id = bi.bookable_item_id
            JOIN flight f ON bi.bookable_item_id = f.flight_id
            JOIN locations ol ON f.origin_id = ol.location_id
            JOIN locations dl ON f.destination_id = dl.location_id
            WHERE bi.type = 'flight'
            AND NOT EXISTS (
                SELECT 1 FROM flight_segment fs 
                WHERE fs.booking_id = b.booking_id 
                AND fs.bookable_item_id = bi_item.bookable_item_id
            )
            ORDER BY b.booked_at DESC
            LIMIT 10
        `);

        console.log(`Found ${flightBookings.length} flight bookings without segments`);

        if (flightBookings.length === 0) {
            console.log('No flight bookings found that need segments');
            return;
        }

        // Add segments for each flight booking
        for (const booking of flightBookings) {
            console.log(`Adding segments for booking ${booking.booking_id}, flight: ${booking.flight_title}`);
            
            // Create a realistic flight segment
            await db.none(`
                INSERT INTO flight_segment (
                    booking_id, 
                    bookable_item_id, 
                    segment_number,
                    origin_id, 
                    destination_id, 
                    departure_time, 
                    arrival_time,
                    airline, 
                    flight_number, 
                    seat_number, 
                    gate, 
                    terminal, 
                    flight_class,
                    is_transit, 
                    transit_duration_minutes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [
                booking.booking_id,
                booking.bookable_item_id,
                1, // segment_number
                booking.origin_location_id,
                booking.dest_location_id,
                booking.departure_time,
                booking.arrival_time,
                booking.airline,
                booking.flight_number,
                `${Math.floor(Math.random() * 30) + 1}A`, // Random seat like "12A", "25B", etc.
                `A${Math.floor(Math.random() * 20) + 1}`, // Random gate like "A5", "B12", etc.
                `T${Math.floor(Math.random() * 3) + 1}`, // Random terminal like "T1", "T2", "T3"
                'Economy', // flight_class
                false, // is_transit
                null // transit_duration_minutes
            ]);
            
            console.log(`✓ Added segment for booking ${booking.booking_id}`);
        }

        console.log('\n✅ Successfully added test flight segments!');
        
        // Show a summary
        const totalSegments = await db.one('SELECT COUNT(*) FROM flight_segment', [], a => +a.count);
        console.log(`Total flight segments in database: ${totalSegments}`);
        
    } catch (error) {
        console.error('❌ Error adding test flight segments:', error);
    } finally {
        // Close database connection
        db.$pool.end();
    }
}

// Run the script
addTestFlightSegments();
