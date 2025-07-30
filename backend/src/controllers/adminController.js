import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// --- DASHBOARD STATS ---

export const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        const [userCount, postCount, communityCount, bookingCount, pendingBookingCount] = await Promise.all([
            db.one('SELECT COUNT(*) FROM user_profiles', [], a => +a.count),
            db.one('SELECT COUNT(*) FROM blogpost', [], a => +a.count),
            db.one('SELECT COUNT(*) FROM community', [], a => +a.count),
            db.one('SELECT COUNT(*) FROM booking', [], a => +a.count),
            db.one("SELECT COUNT(*) FROM booking WHERE status = 'pending'", [], a => +a.count), // Count pending bookings
        ]);
        res.json({
            users: { count: userCount },
            posts: { count: postCount },
            communities: { count: communityCount },
            bookings: { count: bookingCount },
            pendingBookings: { count: pendingBookingCount }
        });
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        throw error; // Let asyncHandler handle the next(error)
    }
});

export const getStatsOverTime = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    try {
        const userStats = await db.any(`
            SELECT DATE(created_at)::date AS day, COUNT(*) AS count
            FROM user_profiles
            WHERE created_at >= NOW() - $1::interval
            GROUP BY day ORDER BY day;
        `, [`${days} days`]);

        const postStats = await db.any(`
            SELECT DATE(created_at)::date AS day, COUNT(*) AS count
            FROM blogpost
            WHERE created_at >= NOW() - $1::interval
            GROUP BY day ORDER BY day;
        `, [`${days} days`]);

        res.json({ users: userStats, posts: postStats });
    } catch (error) {
        console.error("Error in getStatsOverTime:", error);
        throw error; // Let asyncHandler handle the next(error)
    }
});

// --- DYNAMIC DATA-TABLE & MANAGEMENT ---

const getPaginatedData = async (req, res, { baseQuery, countQuery, searchColumns, defaultSortBy = 'created_at', allowedSortBy = [] }) => {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', q = '' } = req.query;

    const actualSortBy = allowedSortBy.includes(sortBy) ? sortBy : defaultSortBy;
    const actualSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    const { status } = req.query; // Handle status filter for bookings
    if (status && baseQuery.includes('booking')) {
        whereClause = `WHERE b.status = $${params.length + 1}`;
        params.push(status);
    }

    if (q && searchColumns.length > 0) {
        const searchConditions = searchColumns.map((col) => {
            params.push(`%${q}%`);
            return `${col} ILIKE $${params.length}`;
        }).join(' OR ');
        
        if (whereClause === '') {
            whereClause = `WHERE (${searchConditions})`;
        } else {
            whereClause += ` AND (${searchConditions})`;
        }
    }

    // Add pagination parameters
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const dataQuery = `${baseQuery} ${whereClause} ORDER BY ${actualSortBy} ${actualSortOrder} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const finalCountQuery = `${countQuery} ${whereClause}`;

    // For count query, we don't need limit/offset parameters
    const countParams = params.slice(0, -2);

    try {
        const [data, totalResult] = await Promise.all([
            db.any(dataQuery, params),
            db.one(finalCountQuery, countParams)
        ]);

        res.json({
            data,
            totalPages: Math.ceil(totalResult.count / limit),
            currentPage: parseInt(page, 10)
        });
    } catch (error) {
        console.error(`Error fetching paginated data for ${baseQuery.split(' ')[3] || 'unknown'}:`, error);
        throw error;
    }
};

export const getUsers = (req, res) => getPaginatedData(req, res, {
    baseQuery: 'SELECT user_id, username, email, role, created_at FROM user_profiles',
    countQuery: 'SELECT COUNT(*) FROM user_profiles',
    searchColumns: ['username', 'email'],
    allowedSortBy: ['user_id', 'username', 'email', 'role', 'created_at'],
    defaultSortBy: 'created_at'
});

export const getPosts = (req, res) => getPaginatedData(req, res, {
    baseQuery: `SELECT p.post_id, p.title, p.created_at, u.username as author_name
                 FROM blogpost p
                 JOIN user_profiles u ON p.author_id = u.user_id`,
    countQuery: 'SELECT COUNT(*) FROM blogpost p JOIN user_profiles u ON p.author_id = u.user_id',
    searchColumns: ['p.title', 'u.username'],
    allowedSortBy: ['post_id', 'title', 'created_at', 'author_name'],
    defaultSortBy: 'created_at'
});

export const getCommunities = (req, res) => getPaginatedData(req, res, {
    baseQuery: 'SELECT community_id, community_name, created_at FROM community',
    countQuery: 'SELECT COUNT(*) FROM community',
    searchColumns: ['community_name'],
    allowedSortBy: ['community_id', 'community_name', 'created_at'],
    defaultSortBy: 'created_at'
});

export const getBookings = (req, res) => getPaginatedData(req, res, {
    baseQuery: `SELECT DISTINCT b.booking_id, b.user_id, b.booked_at, b.travel_date, b.status, up.username as user_username
                FROM booking b
                JOIN user_profiles up ON b.user_id = up.user_id`,
    countQuery: `SELECT COUNT(DISTINCT b.booking_id)
                 FROM booking b
                 JOIN user_profiles up ON b.user_id = up.user_id`,
    searchColumns: ['b.booking_id::text', 'up.username', 'b.status'],
    defaultSortBy: 'booked_at',
    allowedSortBy: ['booking_id', 'user_id', 'user_username', 'booked_at', 'travel_date', 'status']
});

// Get comprehensive booking details for modal (Revised to use multiple queries for clarity and reliability)
// Get comprehensive booking details for modal (Revised to use multiple queries for clarity and reliability)
export const getBookingDetails = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    // Validate UUID format
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(bookingId)) {
        res.status(400);
        throw new Error('Invalid booking ID format.');
    }

    try {
        // 1. Get basic booking and user info
        const basicBooking = await db.oneOrNone(`
            SELECT
                b.booking_id,
                b.booked_at,
                b.travel_date,
                b.status,
                b.user_id,
                up.username,
                up.email,
                up.profile_picture_url
            FROM booking b
            JOIN user_profiles up ON b.user_id = up.user_id
            WHERE b.booking_id = $1
        `, [bookingId]);

        if (!basicBooking) {
            res.status(404);
            throw new Error('Booking not found.');
        }

        // 2. Get all passenger details for this booking
        const passengerDetails = await db.any(`
            SELECT
                passenger_detail_id,
                full_name,
                date_of_birth,
                passport_number,
                nationality,
                email,
                phone,
                created_at,
                updated_at
            FROM passenger_detail
            WHERE booking_id = $1
        `, [bookingId]);

        // 3. Get booking items with their main bookable_item details
        const rawBookedItems = await db.any(`
            SELECT
                bi_item.bookable_item_id,
                bi_item.quantity,
                bi_item.price_at_booking,
                bi_main.title,
                bi_main.description,
                bi_main.type
            FROM booking_item bi_item
            JOIN bookable_item bi_main ON bi_item.bookable_item_id = bi_main.bookable_item_id
            WHERE bi_item.booking_id = $1
        `, [bookingId]);

        // 4. Fetch specific details for each booked item based on its type
        const bookedItemsWithDetails = await Promise.all(rawBookedItems.map(async (item) => {
            let itemDetails = { ...item }; // Start with basic item info

            try {
                if (item.type === 'package') {
                    const packageInfo = await db.oneOrNone(`
                        SELECT
                            tp.destination_id,
                            l.location_name as destination_name,
                            l.country,
                            tp.start_date,
                            tp.end_date,
                            tp.group_size
                        FROM travel_package tp
                        LEFT JOIN locations l ON tp.destination_id = l.location_id
                        WHERE tp.package_id = $1
                    `, [item.bookable_item_id]);
                    itemDetails.package_info = packageInfo;
                } else if (item.type === 'flight') {
                    const flightInfo = await db.oneOrNone(`
                        SELECT
                            f.airline,
                            f.flight_number,
                            ol.location_name as origin_name,
                            dl.location_name as destination_name,
                            f.departure_time,
                            f.arrival_time,
                            f.origin_iata,
                            f.destination_iata,
                            f.duration_minutes
                        FROM flight f
                        LEFT JOIN locations ol ON f.origin_id = ol.location_id
                        LEFT JOIN locations dl ON f.destination_id = dl.location_id
                        WHERE f.flight_id = $1
                    `, [item.bookable_item_id]);
                    itemDetails.flight_info = flightInfo;

                    // Fetch flight segments for this specific flight item
                    const flightSegments = await db.any(`
                        SELECT
                            fs.segment_id,
                            fs.segment_number,
                            ol.location_name as origin_name,
                            dl.location_name as destination_name,
                            ol.iata_code as origin_iata,         
                            dl.iata_code as destination_iata,     
                            fs.departure_time,
                            fs.arrival_time,
                            fs.airline,
                            fs.flight_number,
                            fs.seat_number,
                            fs.gate,
                            fs.terminal,
                            fs.flight_class,
                            fs.is_transit,
                            fs.transit_duration_minutes,
                            EXTRACT(EPOCH FROM (fs.arrival_time - fs.departure_time))/60 as duration_minutes
                        FROM flight_segment fs
                        LEFT JOIN locations ol ON fs.origin_id = ol.location_id
                        LEFT JOIN locations dl ON fs.destination_id = dl.location_id
                        WHERE fs.booking_id = $1 AND fs.bookable_item_id = $2
                        ORDER BY fs.segment_number ASC
                    `, [bookingId, item.bookable_item_id]);
                    itemDetails.flight_segments = flightSegments;

                } else if (item.type === 'accommodation') {
                    const accommodationInfo = await db.oneOrNone(`
                        SELECT
                            a.hotel_name,
                            a.room_type,
                            a.check_in,
                            a.check_out,
                            l.location_name as location_name
                        FROM accommodation a
                        LEFT JOIN locations l ON a.location_id = l.location_id
                        WHERE a.accommodation_id = $1
                    `, [item.bookable_item_id]);
                    itemDetails.accommodation_info = accommodationInfo;
                } else if (item.type === 'activity') {
                    const activityInfo = await db.oneOrNone(`
                        SELECT
                            act.activity_name,
                            act.activity_type,
                            act.duration_minutes,
                            act.start_time,
                            act.end_time,
                            l.location_name as location_name
                        FROM activity act
                        LEFT JOIN locations l ON act.location_id = l.location_id
                        WHERE act.activity_id = $1
                    `, [item.bookable_item_id]);
                    itemDetails.activity_info = activityInfo;
                }
            } catch (itemError) {
                console.error(`Error fetching details for item ${item.bookable_item_id}:`, itemError);
                // Continue processing other items even if one fails
            }
            return itemDetails;
        }));

        // 5. Get invoice info and invoice items
        const invoice = await db.oneOrNone(`
            SELECT
                invoice_id,
                issued_at,
                overall_status
            FROM invoice
            WHERE booking_id = $1
        `, [bookingId]);

        let invoiceInfo = null;
        if (invoice) {
            try {
                const invoiceItems = await db.any(`
                    SELECT
                        invoice_item_id,
                        bookable_item_id,
                        base_price,
                        discount,
                        final_price,
                        payment_status
                    FROM invoice_item
                    WHERE invoice_id = $1
                `, [invoice.invoice_id]);

                invoiceInfo = {
                    invoice_id: invoice.invoice_id,
                    issued_at: invoice.issued_at,
                    overall_status: invoice.overall_status,
                    total_amount: invoiceItems.reduce((sum, item) => sum + parseFloat(item.final_price || 0), 0),
                    discount_amount: invoiceItems.reduce((sum, item) => sum + parseFloat(item.discount || 0), 0),
                    original_amount: invoiceItems.reduce((sum, item) => sum + parseFloat(item.base_price || 0), 0),
                    items: invoiceItems
                };
            } catch (invoiceError) {
                console.error(`Error fetching invoice items for invoice ${invoice.invoice_id}:`, invoiceError);
            }
        }

        // 6. Get any coupon details associated with this booking (this might not exist for all bookings)
        let couponInfo = null;
        try {
            couponInfo = await db.oneOrNone(`
                SELECT
                    c.coupon_id, c.coupon_code, c.coupon_type, c.discount_type, c.discount_value,
                    c.max_discount_amount, c.min_purchase_amount, c.usage_limit, c.usage_count,
                    c.valid_from, c.valid_until, c.title, c.description, c.status, c.created_at, c.updated_at
                FROM coupons c
                JOIN coupon_usage cu ON c.coupon_id = cu.coupon_id
                WHERE cu.booking_id = $1
                LIMIT 1
            `, [bookingId]);
        } catch (couponError) {
            console.error(`Error fetching coupon info for booking ${bookingId}:`, couponError);
            // Continue without coupon info
        }

        // 7. Get payment details
        let paymentInfo = [];
        try {
            paymentInfo = await db.any(`
                SELECT
                    p.payment_id,
                    p.amount,
                    p.payment_date,
                    p.method,
                    p.status,
                    p.invoice_item_id
                FROM payment p
                JOIN invoice_item ii ON p.invoice_item_id = ii.invoice_item_id
                JOIN invoice i ON ii.invoice_id = i.invoice_id
                WHERE i.booking_id = $1
                ORDER BY p.payment_date DESC
            `, [bookingId]);
        } catch (paymentError) {
            console.error(`Error fetching payment info for booking ${bookingId}:`, paymentError);
            // Continue without payment info
        }

        // Build final response object
        const finalBookingDetails = {
            booking_id: basicBooking.booking_id,
            booked_at: basicBooking.booked_at,
            travel_date: basicBooking.travel_date,
            status: basicBooking.status,
            user_info: {
                user_id: basicBooking.user_id,
                username: basicBooking.username,
                email: basicBooking.email,
                profile_picture_url: basicBooking.profile_picture_url
            },
            passenger_details: passengerDetails,
            booked_items: bookedItemsWithDetails,
            invoice_info: invoiceInfo,
            coupon_info: couponInfo,
            payment_info: paymentInfo
        };

        res.json(finalBookingDetails);
    } catch (error) {
        console.error(`Error in getBookingDetails for booking ${bookingId}:`, error);
        throw error;
    }
});


export const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) { 
        res.status(400);
        throw new Error('Invalid role.');
    }
    
    await db.none('UPDATE user_profiles SET role = $1 WHERE user_id = $2', [role, userId]);
    res.json({ message: `User role updated successfully.` });
});

export const deleteContent = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const validTypes = {
        posts: { table: 'blogpost', idCol: 'post_id' },
        communities: { table: 'community', idCol: 'community_id' },
        users: { table: 'user_profiles', idCol: 'user_id' },
        bookings: { table: 'booking', idCol: 'booking_id' },
    };
    if (!validTypes[type]) { res.status(400).throw(new Error('Invalid content type.')); }
    const { table, idCol } = validTypes[type];

    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
        res.status(400);
        throw new Error('Invalid ID format.');
    }

    const result = await db.result(`DELETE FROM "${table}" WHERE "${idCol}" = $1`, [id]);

    if (result.rowCount === 0) {
        res.status(404);
        throw new Error(`${type.slice(0, -1)} with ID ${id} not found.`);
    }

    res.status(200).json({ message: `${type.slice(0, -1)} deleted successfully.` });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['approved', 'cancelled', 'pending'].includes(status)) {
        res.status(400);
        throw new Error('Invalid booking status.');
    }

    const booking = await db.oneOrNone('SELECT booking_id FROM booking WHERE booking_id = $1', [bookingId]);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found.');
    }

    await db.none('UPDATE booking SET status = $1 WHERE booking_id = $2', [status, bookingId]);

    res.status(200).json({ message: `Booking status updated to ${status}.` });
});

export const getPackages = asyncHandler(async (req, res) => {
    // Use the same pattern as other admin data fetching functions
    return getPaginatedData(req, res, {
        baseQuery: `SELECT p.package_id, p.destination_id, p.start_date, p.end_date, p.group_size, p.created_by,
                    bi.title, bi.description, bi.price, bi.created_at,
                    l.location_name as destination_name,
                    COALESCE(up.username, 'System') as creator_name
                    FROM travel_package p
                    JOIN bookable_item bi ON p.package_id = bi.bookable_item_id
                    JOIN locations l ON p.destination_id = l.location_id
                    LEFT JOIN user_profiles up ON p.created_by = up.user_id`,
        countQuery: `SELECT COUNT(*)
                     FROM travel_package p
                     JOIN bookable_item bi ON p.package_id = bi.bookable_item_id
                     JOIN locations l ON p.destination_id = l.location_id
                     LEFT JOIN user_profiles up ON p.created_by = up.user_id`,
        searchColumns: ['bi.title', 'bi.description', 'l.location_name', 'up.username'],
        allowedSortBy: ['package_id', 'title', 'destination_name', 'creator_name', 'start_date', 'end_date', 'price', 'created_at'],
        defaultSortBy: 'created_at'
    });
});

// Get flight bookings specifically
export const getFlightBookings = (req, res) => getPaginatedData(req, res, {
    baseQuery: `SELECT DISTINCT b.booking_id, b.user_id, b.booked_at, b.booked_at as created_at, b.travel_date, b.status, up.username as user_username,
                       bi.title as flight_title, bi.description as flight_description
                FROM booking b
                JOIN user_profiles up ON b.user_id = up.user_id
                JOIN booking_item bi_item ON b.booking_id = bi_item.booking_id
                JOIN bookable_item bi ON bi_item.bookable_item_id = bi.bookable_item_id
                WHERE bi.type = 'flight'`,
    countQuery: `SELECT COUNT(DISTINCT b.booking_id)
                 FROM booking b
                 JOIN user_profiles up ON b.user_id = up.user_id
                 JOIN booking_item bi_item ON b.booking_id = bi_item.booking_id
                 JOIN bookable_item bi ON bi_item.bookable_item_id = bi.bookable_item_id
                 WHERE bi.type = 'flight'`,
    searchColumns: ['b.booking_id::text', 'up.username', 'b.status', 'bi.title'],
    defaultSortBy: 'booked_at',
    allowedSortBy: ['booking_id', 'user_id', 'user_username', 'booked_at', 'created_at', 'travel_date', 'status', 'flight_title']
});

// Get hotel bookings specifically  
export const getHotelBookings = (req, res) => getPaginatedData(req, res, {
    baseQuery: `SELECT DISTINCT b.booking_id, b.user_id, b.booked_at, b.booked_at as created_at, 
                       b.travel_date, b.status, up.username as user_username,
                       h.hotel_name as hotel_title, 
                       CONCAT(hr.room_type, ' - ', hb.guest_count, ' guests') as hotel_description,
                       hb.check_in_date, hb.check_out_date, hb.guest_count, hb.special_requests,
                       h.address as hotel_address, hr.room_type, hr.bed_type, hr.base_price
                FROM booking b
                JOIN user_profiles up ON b.user_id = up.user_id
                JOIN hotel_bookings hb ON b.booking_id = hb.booking_id
                LEFT JOIN hotels h ON hb.hotel_id = h.hotel_id
                LEFT JOIN hotel_rooms hr ON hb.room_id = hr.room_id`,
    countQuery: `SELECT COUNT(DISTINCT b.booking_id)
                 FROM booking b
                 JOIN user_profiles up ON b.user_id = up.user_id
                 JOIN hotel_bookings hb ON b.booking_id = hb.booking_id
                 LEFT JOIN hotels h ON hb.hotel_id = h.hotel_id
                 LEFT JOIN hotel_rooms hr ON hb.room_id = hr.room_id`,
    searchColumns: ['b.booking_id::text', 'up.username', 'b.status', 'h.hotel_name', 'hr.room_type'],
    defaultSortBy: 'booked_at',
    allowedSortBy: ['booking_id', 'user_id', 'user_username', 'booked_at', 'created_at', 'travel_date', 'status', 'hotel_title', 'check_in_date', 'guest_count']
});