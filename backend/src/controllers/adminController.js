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
    let paramIndexOffset = 0;

    const { status } = req.query; // Handle status filter for bookings
    if (status && baseQuery.includes('booking')) {
        whereClause = `WHERE b.status = $1`;
        params.push(status);
    }

    if (q && searchColumns.length > 0) {
        const searchConditions = searchColumns.map((col, index) => {
            params.push(`%${q}%`);
            return `${col} ILIKE $${(whereClause === '' ? 1 : params.length)}`;
        }).join(' OR ');
        
        if (whereClause === '') {
            whereClause = `WHERE ${searchConditions}`;
        } else {
            whereClause += ` AND (${searchConditions})`;
        }
        paramIndexOffset = params.length;
    }

    const dataQuery = `${baseQuery} ${whereClause} ORDER BY "${actualSortBy}" ${actualSortOrder} LIMIT $${paramIndexOffset + 1} OFFSET $${paramIndexOffset + 2}`;
    const finalCountQuery = `${countQuery} ${whereClause}`;

    const finalParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];

    try {
        const [data, totalResult] = await Promise.all([
            db.any(dataQuery, finalParams),
            db.one(finalCountQuery, params)
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
    baseQuery: `SELECT b.booking_id, b.user_id, b.booked_at, b.travel_date, b.status, up.username as user_username
                FROM booking b
                JOIN user_profiles up ON b.user_id = up.user_id`,
    countQuery: `SELECT COUNT(*)
                 FROM booking b
                 JOIN user_profiles up ON b.user_id = up.user_id`,
    searchColumns: ['b.booking_id::text', 'up.username', 'b.status'],
    defaultSortBy: 'booked_at',
    allowedSortBy: ['booking_id', 'user_id', 'user_username', 'booked_at', 'travel_date', 'status']
});

// Get comprehensive booking details for modal
export const getBookingDetails = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const bookingDetails = await db.oneOrNone(`
        SELECT
            b.booking_id,
            b.booked_at,
            b.travel_date,
            b.status,
            json_build_object(
                'user_id', up.user_id,
                'username', up.username,
                'email', up.email,
                'profile_picture_url', up.profile_picture_url
            ) AS user_info,
            json_agg(
                DISTINCT jsonb_build_object(
                    'item_id', bi.bookable_item_id,
                    'title', bi_main.title,
                    'description', bi_main.description,
                    'type', bi_main.type,
                    'price', bi.price_at_booking,
                    'quantity', bi.quantity,
                    -- Passenger details from booking_item (these stay)
                    'passenger_name', bi.passenger_name,
                    'passenger_gender', bi.passenger_gender,
                    'passenger_type', bi.passenger_type,
                    -- Flight specific details from FLIGHT table (f)
                    'seat_number', f.seat_number,    -- From flight table
                    'gate', f.gate,                  -- From flight table
                    'terminal', f.terminal,          -- From flight table
                    'flight_class', f.flight_class,  -- From flight table
                    'flight_info', CASE WHEN bi_main.type = 'flight' THEN
                        json_build_object(
                            'airline', f.airline,
                            'flight_number', f.flight_number,
                            'departure_time', f.departure_time,
                            'arrival_time', f.arrival_time,
                            'duration_minutes', f.duration_minutes, -- From flight table
                            'origin_name', origin_loc.location_name,
                            'origin_iata', origin_loc.iata_code,
                            'destination_name', dest_loc.location_name,
                            'destination_iata', dest_loc.iata_code
                        )
                    ELSE NULL END,
                    -- Flight segments (for transits), linked by booking_id AND bookable_item_id
                    'segments', CASE WHEN bi_main.type = 'flight' THEN
                        (
                            SELECT json_agg(
                                jsonb_build_object(
                                    'segment_id', fs.segment_id,
                                    'segment_number', fs.segment_number,
                                    'origin_name', fs_origin_loc.location_name,
                                    'origin_iata', fs_origin_loc.iata_code,
                                    'destination_name', fs_dest_loc.location_name,
                                    'destination_iata', fs_dest_loc.iata_code,
                                    'departure_time', fs.departure_time,
                                    'arrival_time', fs.arrival_time,
                                    'airline', fs.airline,
                                    'flight_number', fs.flight_number,
                                    'seat_number', fs.seat_number, -- From flight_segment
                                    'gate', fs.gate,             -- From flight_segment
                                    'terminal', fs.terminal,     -- From flight_segment
                                    'flight_class', fs.flight_class, -- From flight_segment
                                    'is_transit', fs.is_transit,
                                    'transit_duration_minutes', fs.transit_duration_minutes
                                ) ORDER BY fs.segment_number
                            )
                            FROM flight_segment fs
                            JOIN locations fs_origin_loc ON fs.origin_id = fs_origin_loc.location_id
                            JOIN locations fs_dest_loc ON fs.destination_id = fs_dest_loc.location_id
                            WHERE fs.booking_id = b.booking_id AND fs.bookable_item_id = bi.bookable_item_id
                        )
                    ELSE NULL END
                )
            ) FILTER (WHERE bi.booking_id IS NOT NULL) AS booked_items,
            json_build_object(
                'invoice_id', i.invoice_id,
                'issued_at', i.issued_at,
                'overall_status', i.overall_status,
                'payments', (
                    SELECT json_agg(
                        jsonb_build_object(
                            'payment_id', p.payment_id,
                            'amount', p.amount,
                            'payment_date', p.payment_date,
                            'method', p.method,
                            'status', p.status
                        )
                    ) FILTER (WHERE p.payment_id IS NOT NULL)
                    FROM invoice_item ii_pay
                    LEFT JOIN payment p ON p.invoice_item_id = ii_pay.invoice_item_id
                    WHERE ii_pay.invoice_id = i.invoice_id
                ),
                'invoice_items_summary', (
                    SELECT json_agg(
                        jsonb_build_object(
                            'item_id', ii_summary.bookable_item_id,
                            'base_price', ii_summary.base_price,
                            'discount', ii_summary.discount,
                            'final_price', ii_summary.final_price,
                            'payment_status', ii_summary.payment_status
                        )
                    ) FILTER (WHERE ii_summary.invoice_item_id IS NOT NULL)
                    FROM invoice_item ii_summary
                    WHERE ii_summary.invoice_id = i.invoice_id
                )
            ) AS invoice_info
        FROM booking b
        JOIN user_profiles up ON b.user_id = up.user_id
        LEFT JOIN booking_item bi ON b.booking_id = bi.booking_id
        LEFT JOIN bookable_item bi_main ON bi.bookable_item_id = bi_main.bookable_item_id
        LEFT JOIN flight f ON bi_main.bookable_item_id = f.flight_id AND bi_main.type = 'flight'
        LEFT JOIN locations origin_loc ON f.origin_id = origin_loc.location_id
        LEFT JOIN locations dest_loc ON f.destination_id = dest_loc.location_id
        LEFT JOIN invoice i ON b.booking_id = i.booking_id
        WHERE b.booking_id = $1
        GROUP BY b.booking_id, up.user_id, i.invoice_id -- Group by all non-aggregated columns
    `, [bookingId]);

    if (!bookingDetails) {
        res.status(404);
        throw new Error('Booking not found.');
    }

    res.json(bookingDetails);
});


export const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) { res.status(400).throw(new Error('Invalid role.')); }
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