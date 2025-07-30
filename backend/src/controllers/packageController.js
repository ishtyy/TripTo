// src/controllers/packageController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Helper to insert into bookable_item and return ID
async function insertBookableItem({ type, title, description, price, created_by }) {
    const result = await db.one(
        `INSERT INTO bookable_item (type, title, description, price, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING bookable_item_id`,
        [type, title, description, price, created_by]
    );
    return result.bookable_item_id;
}

export const createFlight = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, airline, flight_number, origin_id, destination_id, departure_time, arrival_time } = req.body;
    const id = await insertBookableItem({ type: 'flight', title, description, price, created_by });
    await db.none(
        `INSERT INTO flight (flight_id, airline, flight_number, origin_id, destination_id, departure_time, arrival_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, airline, flight_number, origin_id, destination_id, departure_time, arrival_time]
    );
    res.status(201).json({ success: true, flight_id: id });
});

export const createAccommodation = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, hotel_name, location_id, room_type, check_in, check_out } = req.body;
    const id = await insertBookableItem({ type: 'accommodation', title, description, price, created_by });
    await db.none(
        `INSERT INTO accommodation (accommodation_id, hotel_name, location_id, room_type, check_in, check_out)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, hotel_name, location_id, room_type, check_in, check_out]
    );
    res.status(201).json({ success: true, accommodation_id: id });
});

export const createActivity = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, activity_name, location_id, activity_type, duration_minutes, start_time, end_time } = req.body;
    const id = await insertBookableItem({ type: 'activity', title, description, price, created_by });
    await db.none(
        `INSERT INTO activity (activity_id, activity_name, location_id, activity_type, duration_minutes, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, activity_name, location_id, activity_type, duration_minutes, start_time, end_time]
    );
    res.status(201).json({ success: true, activity_id: id });
});

export const createPackage = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, destination_id, start_date, end_date, group_size } = req.body;
    const id = await insertBookableItem({ type: 'package', title, description, price, created_by });
    await db.none(
        `INSERT INTO travel_package (package_id, destination_id, start_date, end_date, group_size, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, destination_id, start_date, end_date, group_size, created_by]
    );
    res.status(201).json({ success: true, package_id: id });
});

export const addModuleToPackage = asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const { module_id, included_by_default = true } = req.body;
    await db.none(
        `INSERT INTO package_module (package_id, module_id, included_by_default)
        VALUES ($1, $2, $3)`,
        [packageId, module_id, included_by_default]
    );
    res.status(201).json({ success: true });
});

// --- Package Search and Details Functions ---

export const searchPublicPackages = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        destination,
        minPrice,
        maxPrice,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = req.query;

    try {
        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions
        if (destination) {
            whereConditions.push(`l.location_name ILIKE $${paramIndex}`);
            queryParams.push(`%${destination}%`);
            paramIndex++;
        }

        if (minPrice) {
            whereConditions.push(`bp.price >= $${paramIndex}`);
            queryParams.push(parseFloat(minPrice));
            paramIndex++;
        }

        if (maxPrice) {
            whereConditions.push(`bp.price <= $${paramIndex}`);
            queryParams.push(parseFloat(maxPrice));
            paramIndex++;
        }

        if (startDate) {
            whereConditions.push(`tp.start_date >= $${paramIndex}`);
            queryParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`tp.end_date <= $${paramIndex}`);
            queryParams.push(endDate);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const validSortColumns = ['created_at', 'price', 'title', 'start_date'];
        const validSortOrders = ['asc', 'desc'];
        const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

        // Main query to get packages
        const packagesQuery = `
            SELECT 
                tp.package_id,
                bp.title,
                bp.description,
                bp.price,
                tp.start_date,
                tp.end_date,
                tp.group_size,
                l.location_name as destination_name,
                l.location_id as destination_id,
                bp.created_at
            FROM travel_package tp
            JOIN bookable_item bp ON tp.package_id = bp.bookable_item_id
            JOIN locations l ON tp.destination_id = l.location_id
            ${whereClause}
            ORDER BY bp.${orderBy} ${order}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM travel_package tp
            JOIN bookable_item bp ON tp.package_id = bp.bookable_item_id
            JOIN locations l ON tp.destination_id = l.location_id
            ${whereClause}
        `;

        const [packages, countResult] = await Promise.all([
            db.any(packagesQuery, queryParams),
            db.one(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
        ]);

        const total = parseInt(countResult.total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            packages,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPackages: total,
                limit: parseInt(limit),
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error searching packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search packages',
            error: error.message
        });
    }
});

export const getPublicPackageDetails = asyncHandler(async (req, res) => {
    const { packageId } = req.params;

    try {
        // Get package details
        const packageDetails = await db.oneOrNone(
            `SELECT 
                tp.package_id,
                bp.title,
                bp.description,
                bp.price,
                tp.start_date,
                tp.end_date,
                tp.group_size,
                l.location_name as destination_name,
                l.location_id as destination_id,
                bp.created_at
            FROM travel_package tp
            JOIN bookable_item bp ON tp.package_id = bp.bookable_item_id
            JOIN locations l ON tp.destination_id = l.location_id
            WHERE tp.package_id = $1`,
            [packageId]
        );

        if (!packageDetails) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        // Get package modules (flights, accommodations, activities)
        const modules = await db.any(
            `SELECT 
                pm.module_id,
                pm.included_by_default,
                bi.type as module_type,
                bi.title,
                bi.description,
                bi.price
            FROM package_module pm
            JOIN bookable_item bi ON pm.module_id = bi.bookable_item_id
            WHERE pm.package_id = $1
            ORDER BY bi.type, bi.title`,
            [packageId]
        );

        res.json({
            success: true,
            package: {
                ...packageDetails,
                modules
            }
        });

    } catch (error) {
        console.error('Error getting package details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get package details',
            error: error.message
        });
    }
});

// --- Package Booking Function (Essential for Coupon Generation) ---

export const bookPackage = asyncHandler(async (req, res) => {

    console.log('🚀 PACKAGE BOOKING STARTED - THIS IS A TEST LOG');
    
    const {
        package_id,
        passenger_details = [],
        total_amount,
        original_amount,
        discount_amount = 0,
        coupon_code = null
    } = req.body;
    const user_id = req.user?.user_id;

    console.log('Package booking request:', { package_id, user_id, passenger_count: passenger_details.length });

    if (!user_id) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required to book packages'
        });
    }

    if (!package_id) {
        return res.status(400).json({
            success: false,
            message: 'Package ID is required'
        });
    }

    if (passenger_details.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one passenger is required'
        });
    }

    try {
        // Start a database transaction
        const bookingResult = await db.tx(async (t) => {
            // 1. Verify package exists and get details
            const packageDetails = await t.oneOrNone(
                `SELECT tp.package_id, tp.destination_id, tp.start_date, tp.end_date, tp.group_size,
            bp.title, bp.description, bp.price,
            l.location_name as destination_name
     FROM travel_package tp
     JOIN bookable_item bp ON tp.package_id = bp.bookable_item_id
     JOIN locations l ON tp.destination_id = l.location_id
     WHERE tp.package_id = $1 AND bp.type = 'package'`,
                [package_id]
            );

            if (!packageDetails) {
                throw new Error(`Package with ID ${package_id} not found or is not a valid package`);
            }

            console.log('Found package details:', packageDetails); // Add logging

            // 2. Validate passenger count
            if (passenger_details.length > packageDetails.group_size) {
                throw new Error(`Maximum ${packageDetails.group_size} passengers allowed for this package`);
            }

            // 3. Create booking record
            const booking = await t.one(
                `INSERT INTO booking (user_id, travel_date, status, booked_at)
                 VALUES ($1, $2, $3, NOW())
                 RETURNING booking_id, booked_at`,
                [user_id, packageDetails.start_date, 'pending']
            );

            const bookingId = booking.booking_id;
            console.log('Created booking with ID:', bookingId);

            // FIX: Create an Invoice for the booking
            const invoice = await t.one(
                `INSERT INTO invoice (booking_id, overall_status)
                 VALUES ($1, 'unpaid')
                 RETURNING invoice_id`,
                [bookingId]
            );
            const invoiceId = invoice.invoice_id;

            // FIX: Insert into booking_item to link booking with the package (bookable_item)
            console.log('Inserting booking_item:', {
                bookingId,
                package_id,
                passenger_count: passenger_details.length,
                total_amount
            });

            await t.none(
                `INSERT INTO booking_item (booking_id, bookable_item_id, quantity, price_at_booking)
     VALUES ($1, $2, $3, $4)`,
                [bookingId, package_id, passenger_details.length, total_amount]
            );

            console.log('Successfully inserted booking_item');

            // FIX: Create an Invoice Item for the package to store financial details
            await t.none(
                `INSERT INTO invoice_item (invoice_id, bookable_item_id, base_price, discount, final_price, payment_status)
                 VALUES ($1, $2, $3, $4, $5, 'unpaid')`,
                [invoiceId, package_id, original_amount, discount_amount, total_amount]
            );

            // FIX: Add passenger details - Map frontend fields to backend table fields
            for (const passenger of passenger_details) {
                const fullName = `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim();
                const nationality = 'Unknown'; // Placeholder, consider collecting from frontend

                await t.none(
                    `INSERT INTO passenger_detail (
                        booking_id, full_name, date_of_birth, passport_number, nationality, email, phone
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        bookingId,
                        fullName,
                        passenger.dateOfBirth || null,
                        passenger.passportNumber || null,
                        nationality,
                        passenger.email || null,
                        passenger.phone || null
                    ]
                );
            }

            // 6. Record coupon usage if a coupon was applied
            if (coupon_code) {
                try {
                    await t.none(
                        `INSERT INTO coupon_usage (coupon_id, user_id, booking_id, original_amount, discount_amount, used_at)
                         SELECT c.coupon_id, $1, $2, $3, $4, NOW()
                         FROM coupons c 
                         WHERE c.coupon_code = $5 AND c.status = 'active'`,
                        [user_id, bookingId, original_amount, discount_amount, coupon_code]
                    );
                    console.log('Coupon usage recorded for:', coupon_code);
                } catch (couponUsageError) {
                    console.error('Error recording coupon usage:', couponUsageError);
                    // Don't fail the transaction for coupon usage errors
                }
            }
            let generatedCoupon = null;

            console.log('Generating flight discount coupon with default settings');
            const settings = {
                discount_percent: 25,
                max_discount_amount: 200,
                validity_days: 90
            };

            try {
                // Generate unique coupon code for booking
                const destCode = packageDetails.destination_name?.slice(0, 4).toUpperCase() || 'TRIP';
                const discount = String(settings.discount_percent).padStart(2, '0');
                let couponCode = `${destCode}${discount}-B${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

                // Ensure uniqueness
                let attempts = 0;
                while (attempts < 10) {
                    const existing = await t.oneOrNone(
                        'SELECT coupon_id FROM coupons WHERE coupon_code = $1',
                        [couponCode]
                    );

                    if (!existing) break;

                    const newRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
                    couponCode = `${destCode}${discount}-B${newRandom}`;
                    attempts++;
                }

                if (attempts < 10) {
                    // Create the coupon
                    const validUntil = new Date();
                    validUntil.setDate(validUntil.getDate() + settings.validity_days);

                    console.log('Creating coupon with code:', couponCode, 'for user:', user_id);

                    const createdCoupon = await t.one(
                        `INSERT INTO coupons (
                            coupon_code, coupon_type, discount_type, discount_value, 
                            max_discount_amount, usage_limit, valid_from, valid_until,
                            assigned_to_user, package_id, booking_id, applicable_to_flights, 
                            applicable_to_packages, title, description, status
                        ) VALUES (
                            $1, 'flight_discount', 'percentage', $2, $3, 1, NOW(), $4,
                            $5, $6, $7, true, false, $8, $9, 'active'
                        ) RETURNING *`,
                        [
                            couponCode,
                            settings.discount_percent,
                            settings.max_discount_amount,
                            validUntil,
                            user_id,
                            package_id,
                            bookingId,
                            `${settings.discount_percent}% Off Your Next Flight`,
                            `Enjoy ${settings.discount_percent}% discount on flight bookings up to $${settings.max_discount_amount} as a thank you for booking ${packageDetails.title}!`
                        ]
                    );

                    console.log('Successfully created coupon:', createdCoupon.coupon_code);

                    generatedCoupon = {
                        coupon_id: createdCoupon.coupon_id,
                        coupon_code: createdCoupon.coupon_code,
                        discount_percent: createdCoupon.discount_value,
                        max_discount_amount: createdCoupon.max_discount_amount,
                        valid_until: createdCoupon.valid_until,
                        title: createdCoupon.title,
                        description: createdCoupon.description
                    };
                } else {
                    console.log('Could not generate unique coupon code after 10 attempts');
                }
            } catch (couponError) {
                console.error('Error creating flight discount coupon:', couponError);
                console.error('Coupon creation failed for user:', user_id, 'package:', package_id);
                // Don't re-throw, allow the main booking transaction to complete even if coupon creation fails
            }

            return {
                booking_id: bookingId,
                booked_at: booking.booked_at,
                package_details: packageDetails,
                passenger_count: passenger_details.length,
                status: 'pending',
                message: 'Package booking created successfully. Payment processing pending.',
                flight_discount_coupon: generatedCoupon
            };
        });

        res.status(201).json({
            success: true,
            message: 'Package booking created successfully!',
            booking: {
                booking_id: bookingResult.booking_id,
                booked_at: bookingResult.booked_at,
                package: {
                    title: bookingResult.package_details.title,
                    destination: bookingResult.package_details.destination_name,
                    start_date: bookingResult.package_details.start_date,
                    end_date: bookingResult.package_details.end_date,
                    price: bookingResult.package_details.price
                },
                passenger_count: bookingResult.passenger_count,
                status: bookingResult.status,
                flight_discount_coupon: bookingResult.flight_discount_coupon
            }
        });

    } catch (error) {
        console.error('Error booking package:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            package_id,
            user_id,
            passenger_count: passenger_details?.length
        });

        let errorMessage = 'Failed to book package';

        // Handle specific database errors
        if (error.code === '23503') {
            errorMessage = 'Package not found or invalid package ID';
        } else if (error.code === '23505') {
            errorMessage = 'Booking already exists';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            debug: {
                code: error.code,
                detail: error.detail
            }
        });
    }
});

// --- Admin Package Functions ---

export const createCompletePackage = asyncHandler(async (req, res) => {
    const { packageData, modules = [] } = req.body;

    try {
        const result = await db.tx(async (t) => {
            // Create the package
            const packageId = await insertBookableItem({
                type: 'package',
                title: packageData.title,
                description: packageData.description,
                price: packageData.price,
                created_by: req.user?.user_id
            });

            // Insert travel package details
            await t.none(
                `INSERT INTO travel_package (package_id, destination_id, start_date, end_date, group_size)
                 VALUES ($1, $2, $3, $4, $5)`,
                [packageId, packageData.destination_id, packageData.start_date, packageData.end_date, packageData.group_size]
            );

            // Add modules to package
            for (const module of modules) {
                await t.none(
                    `INSERT INTO package_module (package_id, module_id, included_by_default)
                     VALUES ($1, $2, $3)`,
                    [packageId, module.module_id, module.included_by_default || false]
                );
            }

            return packageId;
        });

        res.status(201).json({
            success: true,
            package_id: result,
            message: 'Package created successfully'
        });

    } catch (error) {
        console.error('Error creating complete package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create package',
            error: error.message
        });
    }
});

export const getPackageDetails = asyncHandler(async (req, res) => {
    const { packageId } = req.params;

    try {
        const packageDetails = await getPublicPackageDetails.apply(this, [req, res]);
        return packageDetails;
    } catch (error) {
        console.error('Error getting package details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get package details',
            error: error.message
        });
    }
});

export const updatePackage = asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const {
        title,
        description,
        destination,
        start_date,
        end_date,
        group_size,
        hotels = [],
        activities = [],
        flight_discount_metadata,
        total_slots,
        available_until
    } = req.body;

    console.log('Updating package with payload:', JSON.stringify(req.body, null, 2));

    try {
        await db.tx(async (t) => {
            // Calculate the total price from hotels and activities
            const hotelTotal = hotels.reduce((sum, hotel) => sum + (parseFloat(hotel.price) || 0), 0);
            const activityTotal = activities.reduce((sum, activity) => sum + (parseFloat(activity.price) || 0), 0);
            const totalPrice = hotelTotal + activityTotal;

            // 1. Update bookable_item (package basic info)
            await t.none(
                `UPDATE bookable_item 
                 SET title = $1, description = $2, price = $3 
                 WHERE bookable_item_id = $4`,
                [title, description, totalPrice, packageId]
            );

            // 2. Handle destination - if it's an object with coordinates, find or create location
            let destinationId = null;
            if (destination) {
                if (typeof destination === 'object' && destination.latitude && destination.longitude) {
                    // Try to find existing location by coordinates or name
                    const existingLocation = await t.oneOrNone(
                        `SELECT location_id FROM locations 
                         WHERE location_name = $1 OR (latitude = $2 AND longitude = $3)
                         LIMIT 1`,
                        [destination.name, destination.latitude, destination.longitude]
                    );

                    if (existingLocation) {
                        destinationId = existingLocation.location_id;
                    } else {
                        // Create new location
                        const newLocation = await t.one(
                            `INSERT INTO locations (location_name, latitude, longitude, country) 
                             VALUES ($1, $2, $3, $4) 
                             RETURNING location_id`,
                            [destination.name, destination.latitude, destination.longitude, destination.country || 'Unknown']
                        );
                        destinationId = newLocation.location_id;
                    }
                } else if (destination.id) {
                    destinationId = destination.id;
                }
            }

            // 3. Update travel_package
            await t.none(
                `UPDATE travel_package 
                 SET start_date = $1, end_date = $2, group_size = $3, destination_id = $4,
                     total_slots = $5, available_until = $6
                 WHERE package_id = $7`,
                [start_date, end_date, group_size, destinationId, total_slots, available_until, packageId]
            );

            // 4. Delete existing package modules (hotels/activities) to replace them
            await t.none(`DELETE FROM package_module WHERE package_id = $1`, [packageId]);

            // 5. Add hotels as accommodation modules
            for (const hotel of hotels) {
                // Create accommodation record using the transaction
                const accommodationId = await t.one(
                    `INSERT INTO bookable_item (bookable_item_id, type, title, description, price, created_by)
                     VALUES (gen_random_uuid(), 'accommodation', $1, $2, $3, $4)
                     RETURNING bookable_item_id`,
                    [hotel.title || hotel.hotel_name, hotel.description, hotel.price, null]
                );

                // Insert accommodation details
                await t.none(
                    `INSERT INTO accommodation (accommodation_id, hotel_name, room_type, location_id, check_in, check_out)
                     VALUES ($1, $2, $3, $4, NOW()::date, (NOW() + interval '1 day')::date)`,
                    [accommodationId.bookable_item_id, hotel.hotel_name, hotel.room_type, destinationId]
                );

                // Link to package
                await t.none(
                    `INSERT INTO package_module (package_id, module_id, included_by_default)
                     VALUES ($1, $2, $3)`,
                    [packageId, accommodationId.bookable_item_id, !hotel.optional]
                );
            }

            // 6. Add activities as activity modules
            for (const activity of activities) {
                // Create activity record using the transaction
                const activityId = await t.one(
                    `INSERT INTO bookable_item (bookable_item_id, type, title, description, price, created_by)
                     VALUES (gen_random_uuid(), 'activity', $1, $2, $3, $4)
                     RETURNING bookable_item_id`,
                    [activity.title || activity.activity_name, activity.description, activity.price, null]
                );

                // Insert activity details
                await t.none(
                    `INSERT INTO activity (activity_id, activity_name, activity_type, duration_minutes, start_time, end_time, location_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        activityId.bookable_item_id,
                        activity.activity_name,
                        activity.activity_type || 'adventure',
                        activity.duration_minutes || 60,
                        activity.start_time || '09:00:00',
                        activity.end_time || '17:00:00',
                        destinationId
                    ]
                );

                // Link to package
                await t.none(
                    `INSERT INTO package_module (package_id, module_id, included_by_default)
                     VALUES ($1, $2, $3)`,
                    [packageId, activityId.bookable_item_id, !activity.optional]
                );
            }

            // 7. Handle flight discount metadata (store as JSON in a metadata table or package table)
            // For now, we'll skip this as the database schema doesn't have a dedicated place for it
            // You might want to add a metadata column to travel_package table

        });

        res.json({
            success: true,
            message: 'Package updated successfully'
        });

    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update package',
            error: error.message
        });
    }
});