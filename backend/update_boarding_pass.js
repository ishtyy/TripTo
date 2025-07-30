// Script to update approved flight bookings with boarding pass details

import db from './src/config/db.js';

async function updateBoardingPassDetails() {
    try {
        console.log('Checking for approved flight bookings with segments...');
        
        // Get approved flight bookings that have segments but may need better boarding pass details
        const approvedFlightBookings = await db.any(`
            SELECT DISTINCT 
                fs.segment_id,
                fs.booking_id,
                fs.bookable_item_id,
                b.status,
                b.booked_at,
                bi.title as flight_title,
                fs.seat_number,
                fs.gate,
                fs.terminal
            FROM flight_segment fs
            JOIN booking b ON fs.booking_id = b.booking_id
            JOIN bookable_item bi ON fs.bookable_item_id = bi.bookable_item_id
            WHERE b.status = 'approved'
            AND bi.type = 'flight'
            ORDER BY b.booked_at DESC
        `);

        console.log(`Found ${approvedFlightBookings.length} approved flight segments`);

        if (approvedFlightBookings.length === 0) {
            console.log('No approved flight bookings found');
            return;
        }

        // Update each segment with realistic boarding pass details
        for (const segment of approvedFlightBookings) {
            console.log(`Updating boarding pass details for segment ${segment.segment_id}`);
            
            const seatNumbers = ['12A', '15B', '8C', '23A', '11F', '17D', '9A', '21B', '6C', '19F'];
            const gates = ['A5', 'B12', 'C8', 'D15', 'A3', 'B7', 'C11', 'D9', 'A18', 'B22'];
            const terminals = ['T1', 'T2', 'T3'];
            
            const randomSeat = seatNumbers[Math.floor(Math.random() * seatNumbers.length)];
            const randomGate = gates[Math.floor(Math.random() * gates.length)];
            const randomTerminal = terminals[Math.floor(Math.random() * terminals.length)];
            
            await db.none(`
                UPDATE flight_segment 
                SET 
                    seat_number = $1,
                    gate = $2,
                    terminal = $3,
                    flight_class = COALESCE(flight_class, 'Economy')
                WHERE segment_id = $4
            `, [randomSeat, randomGate, randomTerminal, segment.segment_id]);
            
            console.log(`✓ Updated segment ${segment.segment_id} - Seat: ${randomSeat}, Gate: ${randomGate}, Terminal: ${randomTerminal}`);
        }

        console.log('\n✅ Successfully updated boarding pass details!');
        
        // Show summary of updated segments
        const updatedSegments = await db.any(`
            SELECT 
                fs.segment_id,
                fs.seat_number,
                fs.gate,
                fs.terminal,
                bi.title as flight_title,
                b.status
            FROM flight_segment fs
            JOIN booking b ON fs.booking_id = b.booking_id
            JOIN bookable_item bi ON fs.bookable_item_id = bi.bookable_item_id
            WHERE b.status = 'approved'
            AND bi.type = 'flight'
            ORDER BY fs.segment_id
        `);
        
        console.log('\nUpdated segments:');
        updatedSegments.forEach(segment => {
            console.log(`- ${segment.flight_title}: Seat ${segment.seat_number}, Gate ${segment.gate}, Terminal ${segment.terminal}`);
        });
        
    } catch (error) {
        console.error('❌ Error updating boarding pass details:', error);
    } finally {
        // Close database connection
        db.$pool.end();
    }
}

// Run the script
updateBoardingPassDetails();
