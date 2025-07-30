import db from './src/config/db.js';

async function runComprehensiveTest() {
  try {
    console.log('🔄 Running comprehensive test of TripTo features...\n');

    // Test 1: Check coupon system
    console.log('1️⃣ Testing Coupon System:');
    const couponsResult = await db.query(`
      SELECT c.coupon_code, c.status, c.assigned_to_user, up.username
      FROM coupons c
      LEFT JOIN user_profiles up ON c.assigned_to_user = up.user_id
      WHERE c.created_at > NOW() - INTERVAL '7 days'
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    console.log(`   ✅ Found ${couponsResult.length} recent coupons`);
    couponsResult.forEach((coupon, i) => {
      console.log(`   ${i+1}. ${coupon.coupon_code} (${coupon.status}) → ${coupon.username || 'Unassigned'}`);
    });

    // Test 2: Check recent posts with vote counts
    console.log('\n2️⃣ Testing Post Voting System:');
    const postsResult = await db.query(`
      SELECT title, upvote_count, downvote_count, 
             (upvote_count - downvote_count) as net_score
      FROM blogpost
      WHERE created_at > NOW() - INTERVAL '30 days'
      ORDER BY (upvote_count - downvote_count) DESC
      LIMIT 5
    `);
    console.log(`   ✅ Found ${postsResult.length} recent posts with votes`);
    postsResult.forEach((post, i) => {
      console.log(`   ${i+1}. "${post.title}" (↑${post.upvote_count} ↓${post.downvote_count} = ${post.net_score})`);
    });

    // Test 3: Check communities and member counts
    console.log('\n3️⃣ Testing Community System:');
    const communitiesResult = await db.query(`
      SELECT c.community_name, 
             COUNT(cm.user_id) as member_count,
             c.created_at
      FROM community c
      LEFT JOIN community_membership cm ON c.community_id = cm.community_id
      GROUP BY c.community_id, c.community_name, c.created_at
      ORDER BY member_count DESC
      LIMIT 5
    `);
    console.log(`   ✅ Found ${communitiesResult.length} active communities`);
    communitiesResult.forEach((community, i) => {
      console.log(`   ${i+1}. "${community.community_name}" (${community.member_count} members)`);
    });

    // Test 4: Check package bookings and coupon usage
    console.log('\n4️⃣ Testing Package Booking & Coupon Usage:');
    const bookingsResult = await db.query(`
      SELECT b.booking_id, item.title as package_title, 
             CASE WHEN cu.usage_id IS NOT NULL THEN true ELSE false END as coupon_used,
             cu.discount_amount,
             up.username, b.booked_at
      FROM booking b
      JOIN booking_item bi ON b.booking_id = bi.booking_id
      JOIN bookable_item item ON bi.bookable_item_id = item.bookable_item_id
      JOIN travel_package tp ON item.bookable_item_id = tp.package_id
      JOIN user_profiles up ON b.user_id = up.user_id
      LEFT JOIN coupon_usage cu ON b.booking_id = cu.booking_id
      WHERE b.booked_at > NOW() - INTERVAL '30 days' AND item.type = 'package'
      ORDER BY b.booked_at DESC
      LIMIT 5
    `);
    console.log(`   ✅ Found ${bookingsResult.length} recent package bookings`);
    bookingsResult.forEach((booking, i) => {
      const couponInfo = booking.coupon_used ? 
        `(Used coupon: $${booking.discount_amount} discount)` : 
        '(No coupon used)';
      console.log(`   ${i+1}. ${booking.username} → "${booking.package_title}" ${couponInfo}`);
    });

    console.log('\n🎉 Comprehensive test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runComprehensiveTest();
