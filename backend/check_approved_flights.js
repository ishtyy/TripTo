// Script to check approved flight bookings and their segments

import db from './src/config/db.js';

async function checkApprovedFlightBookings() {
    try {
        console.log('Checking approved flight bookings with segments...\n');
        
        const results = await db.any(`
            SELECT 
                b.booking_id,
                b.status,
                bi.title as flight_title,
                fs.segment_id,
                fs.seat_number,
                fs.gate,
                fs.terminal,
                ol.iata_code as origin_iata,
                dl.iata_code as destination_iata
            FROM booking b
            JOIN booking_item bi_item ON b.booking_id = bi_item.booking_id
            JOIN bookable_item bi ON bi_item.bookable_item_id = bi.bookable_item_id
            LEFT JOIN flight_segment fs ON b.booking_id = fs.booking_id AND bi_item.bookable_item_id = fs.bookable_item_id
            LEFT JOIN locations ol ON fs.origin_id = ol.location_id
            LEFT JOIN locations dl ON fs.destination_id = dl.location_id
            WHERE bi.type = 'flight'
            ORDER BY b.status, b.booked_at DESC
        `);

        if (results.length === 0) {
            console.log('❌ No flight bookings found');
            return;
        }

        console.log(`Found ${results.length} flight booking records:\n`);

        const groupedByBooking = results.reduce((acc, row) => {
            if (!acc[row.booking_id]) {
                acc[row.booking_id] = {
                    booking_id: row.booking_id,
                    status: row.status,
                    flight_title: row.flight_title,
                    segments: []
                };
            }
            if (row.segment_id) {
                acc[row.booking_id].segments.push({
                    segment_id: row.segment_id,
                    route: `${row.origin_iata} → ${row.destination_iata}`,
                    seat: row.seat_number,
                    gate: row.gate,
                    terminal: row.terminal
                });
            }
            return acc;
        }, {});

        Object.values(groupedByBooking).forEach(booking => {
            const statusIcon = booking.status === 'approved' ? '✅' : 
                             booking.status === 'pending' ? '⏳' : '❌';
            
            console.log(`${statusIcon} ${booking.flight_title} (${booking.status.toUpperCase()})`);
            console.log(`   ID: ${booking.booking_id}`);
            
            if (booking.segments.length > 0) {
                console.log(`   Segments: ${booking.segments.length}`);
                booking.segments.forEach((segment, idx) => {
                    console.log(`     ${idx + 1}. ${segment.route} - Seat: ${segment.seat || 'N/A'}, Gate: ${segment.gate || 'N/A'}, Terminal: ${segment.terminal || 'N/A'}`);
                });
            } else {
                console.log(`   ⚠️  No segments found`);
            }
            console.log('');
        });

        const approvedWithSegments = Object.values(groupedByBooking).filter(b => 
            b.status === 'approved' && b.segments.length > 0
        ).length;

        console.log(`\n📊 Summary:`);
        console.log(`   Total flight bookings: ${Object.keys(groupedByBooking).length}`);
        console.log(`   Approved with segments: ${approvedWithSegments}`);
        console.log(`   ${approvedWithSegments > 0 ? '✅ Boarding passes should be visible!' : '❌ No boarding passes will be shown'}`);
        
    } catch (error) {
        console.error('❌ Error checking flight bookings:', error);
    } finally {
        db.$pool.end();
    }
}

checkApprovedFlightBookings();
