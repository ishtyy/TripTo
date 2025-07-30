import db from './src/config/db.js';

async function testCouponCreation() {
    try {
        console.log('Checking recent coupons...');
        const allCoupons = await db.any('SELECT * FROM coupons ORDER BY created_at DESC LIMIT 5');
        console.log('Recent coupons:', JSON.stringify(allCoupons, null, 2));
        
        console.log('\nChecking recent package bookings...');
        const recentBookings = await db.any(`
            SELECT b.booking_id, b.user_id, b.booked_at, bi.title as package_title
            FROM booking b
            JOIN booking_item bi_item ON b.booking_id = bi_item.booking_id
            JOIN bookable_item bi ON bi_item.bookable_item_id = bi.bookable_item_id
            WHERE bi.type = 'package'
            ORDER BY b.booked_at DESC LIMIT 5
        `);
        console.log('Recent package bookings:', JSON.stringify(recentBookings, null, 2));
        
        // Check if any user has coupons
        console.log('\nChecking user coupons...');
        const userCoupons = await db.any(`
            SELECT assigned_to_user, COUNT(*) as coupon_count
            FROM coupons 
            WHERE assigned_to_user IS NOT NULL
            GROUP BY assigned_to_user
        `);
        console.log('User coupon counts:', JSON.stringify(userCoupons, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testCouponCreation();
