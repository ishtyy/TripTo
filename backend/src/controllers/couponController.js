// src/controllers/couponController.js
import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Generate booking-specific coupon code
const generateBookingCouponCode = (destinationCode, discountPercent) => {
    const destCode = destinationCode.substring(0, 3).toUpperCase();
    const discount = discountPercent.toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${destCode}${discount}-B${random}`;
}

// Create a flight discount coupon for a booking
export const createBookingFlightCoupon = asyncHandler(async (req, res) => {
    const { 
        booking_id,
        package_id, 
        user_id, 
        discount_percent = 25, 
        max_discount_amount = 200, 
        validity_days = 90 
    } = req.body;

    // Validate required fields
    if (!booking_id || !package_id || !user_id) {
        return res.status(400).json({
            success: false,
            message: 'booking_id, package_id, and user_id are required'
        });
    }

    try {
        // Get package details for coupon customization
        const packageResult = await db.oneOrNone(
            `SELECT tp.package_id, bp.title as package_title, l.name as destination_name
             FROM travel_package tp
             JOIN bookable_item bp ON tp.package_id = bp.bookable_item_id
             JOIN locations l ON tp.destination_id = l.location_id
             WHERE tp.package_id = $1`,
            [package_id]
        );

        if (!packageResult) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        // Generate unique coupon code
        const couponCode = generateBookingCouponCode(packageResult.destination_name, discount_percent);

        // Check if coupon already exists for this booking
        const existingCoupon = await db.oneOrNone(
            'SELECT coupon_id FROM coupons WHERE booking_id = $1 AND status = $2',
            [booking_id, 'active']
        );

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Flight discount coupon already exists for this booking'
            });
        }

        // Create the coupon
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validity_days);

        const coupon = await db.one(
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
                discount_percent,
                max_discount_amount,
                validUntil,
                user_id,
                package_id,
                booking_id,
                `${discount_percent}% Off Your Next Flight`,
                `Enjoy ${discount_percent}% discount on flight bookings up to $${max_discount_amount} as a thank you for booking ${packageResult.package_title}!`
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Flight discount coupon created successfully',
            coupon: {
                coupon_id: coupon.coupon_id,
                coupon_code: coupon.coupon_code,
                discount_percent: coupon.discount_value,
                max_discount_amount: coupon.max_discount_amount,
                valid_until: coupon.valid_until,
                title: coupon.title,
                description: coupon.description
            }
        });

    } catch (error) {
        console.error('Error creating booking flight coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create flight discount coupon',
            error: error.message 
        });
    }
});

// Validate and apply coupon to a booking
export const applyCoupon = asyncHandler(async (req, res) => {
    const { coupon_code, user_id, original_amount } = req.body;

    try {
        // Get coupon details with validation
        const coupon = await db.oneOrNone(
            `SELECT c.*, 
                CASE 
                    WHEN c.usage_limit > 0 AND (
                        SELECT COALESCE(COUNT(*), 0) 
                        FROM coupon_usage cu 
                        WHERE cu.coupon_id = c.coupon_id
                    ) >= c.usage_limit THEN false
                    WHEN c.valid_until < NOW() THEN false
                    WHEN c.valid_from > NOW() THEN false
                    WHEN c.status != 'active' THEN false
                    ELSE true
                END as is_valid
             FROM coupons c 
             WHERE c.coupon_code = $1`,
            [coupon_code]
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        if (!coupon.is_valid) {
            let reason = 'Coupon is not valid';
            // Added more specific reasons for invalidity
            if (coupon.valid_until < new Date()) {
                reason = 'Coupon has expired';
            } else if (coupon.valid_from > new Date()) {
                reason = 'Coupon is not active yet';
            } else if (coupon.status !== 'active') {
                reason = 'Coupon is inactive';
            } else {
                const usageCountResult = await db.one(
                    'SELECT COALESCE(COUNT(*), 0) as count FROM coupon_usage WHERE coupon_id = $1',
                    [coupon.coupon_id]
                );
                if (coupon.usage_limit > 0 && parseInt(usageCountResult.count) >= coupon.usage_limit) {
                    reason = 'Coupon has reached its usage limit';
                }
            }
            
            return res.status(400).json({
                success: false,
                message: reason
            });
        }

        // Check if user is eligible (if coupon is user-specific)
        if (coupon.assigned_to_user && coupon.assigned_to_user !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'This coupon is not available for your account'
            });
        }

        // Calculate discount
        let discount_amount = 0;
        if (coupon.discount_type === 'percentage') {
            discount_amount = (original_amount * coupon.discount_value) / 100;
            if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
                discount_amount = coupon.max_discount_amount;
            }
        } else if (coupon.discount_type === 'fixed') {
            discount_amount = Math.min(coupon.discount_value, original_amount);
        }

        const final_amount = Math.max(0, original_amount - discount_amount);

        res.json({
            success: true,
            coupon: {
                coupon_id: coupon.coupon_id,
                coupon_code: coupon.coupon_code,
                title: coupon.title,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value
            },
            pricing: {
                original_amount,
                discount_amount,
                final_amount
            }
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply coupon',
            error: error.message
        });
    }
});

// Record coupon usage
export const useCoupon = asyncHandler(async (req, res) => {
    const { coupon_code, user_id, booking_id, original_amount, discount_amount } = req.body;

    try {
        // Get coupon details
        const coupon = await db.oneOrNone(
            'SELECT coupon_id, usage_limit FROM coupons WHERE coupon_code = $1 AND status = $2',
            [coupon_code, 'active']
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon has already been used by this user
        const existingUsage = await db.oneOrNone(
            'SELECT usage_id FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
            [coupon.coupon_id, user_id]
        );

        if (existingUsage) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has already been used'
            });
        }
        
        // Check overall usage limit
        const usageCountResult = await db.one(
            'SELECT COALESCE(COUNT(*), 0) as count FROM coupon_usage WHERE coupon_id = $1',
            [coupon.coupon_id]
        );

        if (coupon.usage_limit > 0 && parseInt(usageCountResult.count) >= coupon.usage_limit) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has reached its usage limit'
            });
        }


        // Record usage
        const usage = await db.one(
            `INSERT INTO coupon_usage (
                coupon_id, user_id, booking_id, original_amount, 
                discount_amount, used_at
            ) VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING *`,
            [coupon.coupon_id, user_id, booking_id, original_amount, discount_amount]
        );

        res.json({
            success: true,
            message: 'Coupon used successfully',
            usage_id: usage.usage_id
        });

    } catch (error) {
        console.error('Error using coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to use coupon',
            error: error.message
        });
    }
});

// Get user's available coupons
export const getUserCoupons = asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    const { type, status = 'active' } = req.query; // 'active' is default, can be 'all'

    try {
        let query = `
            SELECT c.*, 
                CASE 
                    WHEN c.usage_limit > 0 AND (
                        SELECT COALESCE(COUNT(*), 0) 
                        FROM coupon_usage cu 
                        WHERE cu.coupon_id = c.coupon_id AND cu.user_id = $1
                    ) >= c.usage_limit THEN 'used_by_user'
                    WHEN c.valid_until < NOW() THEN 'expired'
                    WHEN c.valid_from > NOW() THEN 'not_active_yet'
                    WHEN c.status != 'active' THEN 'inactive'
                    ELSE 'available'
                END as current_status,
                (
                    SELECT COUNT(*) 
                    FROM coupon_usage cu 
                    WHERE cu.coupon_id = c.coupon_id
                ) as times_used
            FROM coupons c 
            WHERE c.assigned_to_user IS NULL OR c.assigned_to_user = $1`; // Coupons can be for specific user or general

        const params = [user_id];
        let paramIndex = 2;

        // Apply status filter based on 'current_status' derived field for user view
        if (status !== 'all') {
            if (status === 'available') {
                query += ` AND (c.valid_until >= NOW() AND c.valid_from <= NOW() AND c.status = 'active' AND 
                               (c.usage_limit IS NULL OR c.usage_limit = 0 OR 
                                (SELECT COALESCE(COUNT(*), 0) FROM coupon_usage cu WHERE cu.coupon_id = c.coupon_id AND cu.user_id = $1) < c.usage_limit))`;
            } else if (status === 'used_by_user') {
                query += ` AND (SELECT COALESCE(COUNT(*), 0) FROM coupon_usage cu WHERE cu.coupon_id = c.coupon_id AND cu.user_id = $1) >= c.usage_limit`;
            } else if (status === 'expired') {
                query += ` AND c.valid_until < NOW()`;
            } else if (status === 'not_active_yet') {
                query += ` AND c.valid_from > NOW()`;
            } else if (status === 'inactive') {
                query += ` AND c.status != 'active'`;
            }
        }
        
        if (type) {
            query += ` AND c.coupon_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        query += ` ORDER BY c.created_at DESC`;

        const coupons = await db.any(query, params);

        res.json({
            success: true,
            coupons
        });

    } catch (error) {
        console.error('Error fetching user coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message
        });
    }
});

// Get all coupons (admin)
export const getAllCoupons = asyncHandler(async (req, res) => {
    const { status, type, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT c.*, 
                u.first_name, u.last_name, u.email,
                (
                    SELECT COUNT(*) 
                    FROM coupon_usage cu 
                    WHERE cu.coupon_id = c.coupon_id
                ) as times_used,
                CASE 
                    WHEN c.usage_limit > 0 AND (
                        SELECT COALESCE(COUNT(*), 0) 
                        FROM coupon_usage cu 
                        WHERE cu.coupon_id = c.coupon_id
                    ) >= c.usage_limit THEN 'used'
                    WHEN c.valid_until < NOW() THEN 'expired'
                    WHEN c.valid_from > NOW() THEN 'not_active_yet'
                    WHEN c.status != 'active' THEN 'inactive'
                    ELSE 'available'
                END as current_status
            FROM coupons c 
            LEFT JOIN users u ON c.assigned_to_user = u.user_id
            WHERE 1=1`;

        const params = [];
        let paramIndex = 1;

        if (status) {
            // Admin can filter by the direct status field or current_status (derived)
            if (['active', 'inactive'].includes(status)) {
                query += ` AND c.status = $${paramIndex}`;
                params.push(status);
            } else { // Filter by derived current_status for admin panel
                query += ` AND (
                    CASE 
                        WHEN c.usage_limit > 0 AND (SELECT COALESCE(COUNT(*), 0) FROM coupon_usage cu WHERE cu.coupon_id = c.coupon_id) >= c.usage_limit THEN 'used'
                        WHEN c.valid_until < NOW() THEN 'expired'
                        WHEN c.valid_from > NOW() THEN 'not_active_yet'
                        WHEN c.status != 'active' THEN 'inactive'
                        ELSE 'available'
                    END
                ) = $${paramIndex}`;
                params.push(status);
            }
            paramIndex++;
        }

        if (type) {
            query += ` AND c.coupon_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const coupons = await db.any(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM coupons c WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (status) {
            if (['active', 'inactive'].includes(status)) {
                countQuery += ` AND c.status = $${countParamIndex}`;
                countParams.push(status);
            } else {
                countQuery += ` AND (
                    CASE 
                        WHEN c.usage_limit > 0 AND (SELECT COALESCE(COUNT(*), 0) FROM coupon_usage cu WHERE cu.coupon_id = c.coupon_id) >= c.usage_limit THEN 'used'
                        WHEN c.valid_until < NOW() THEN 'expired'
                        WHEN c.valid_from > NOW() THEN 'not_active_yet'
                        WHEN c.status != 'active' THEN 'inactive'
                        ELSE 'available'
                    END
                ) = $${countParamIndex}`;
                countParams.push(status);
            }
            countParamIndex++;
        }

        if (type) {
            countQuery += ` AND c.coupon_type = $${countParamIndex}`;
            countParams.push(type);
        }

        const totalCount = await db.one(countQuery, countParams);

        res.json({
            success: true,
            coupons,
            pagination: {
                total: parseInt(totalCount.count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error fetching all coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message
        });
    }
});

// Get coupons for a specific package
export const getPackageCoupons = asyncHandler(async (req, res) => {
    const { package_id } = req.params;
    const { status = 'active' } = req.query;

    try {
        let query = `
            SELECT c.*, 
                u.first_name, u.last_name, u.email,
                (
                    SELECT COUNT(*) 
                    FROM coupon_usage cu 
                    WHERE cu.coupon_id = c.coupon_id
                ) as times_used,
                CASE 
                    WHEN c.usage_limit > 0 AND (
                        SELECT COALESCE(COUNT(*), 0) 
                        FROM coupon_usage cu 
                        WHERE cu.coupon_id = c.coupon_id
                    ) >= c.usage_limit THEN 'used'
                    WHEN c.valid_until < NOW() THEN 'expired'
                    WHEN c.valid_from > NOW() THEN 'not_active_yet'
                    WHEN c.status != 'active' THEN 'inactive'
                    ELSE 'available'
                END as current_status
            FROM coupons c 
            LEFT JOIN users u ON c.assigned_to_user = u.user_id
            WHERE c.package_id = $1`;

        const params = [package_id];

        if (status !== 'all') {
            // Apply status filter based on 'current_status' derived field
            if (status === 'available') {
                query += ` AND (c.valid_until >= NOW() AND c.valid_from <= NOW() AND c.status = 'active' AND 
                               (c.usage_limit IS NULL OR c.usage_limit = 0 OR 
                                (SELECT COALESCE(COUNT(*), 0) FROM coupon_usage cu WHERE cu.coupon_id = c.coupon_id) < c.usage_limit))`;
            } else if (status === 'used') {
                query += ` AND (SELECT COALESCE(COUNT(*), 0) FROM coupon_usage cu WHERE cu.coupon_id = c.coupon_id) >= c.usage_limit`;
            } else if (status === 'expired') {
                query += ` AND c.valid_until < NOW()`;
            } else if (status === 'not_active_yet') {
                query += ` AND c.valid_from > NOW()`;
            } else if (status === 'inactive') {
                query += ` AND c.status != 'active'`;
            } else { // Fallback to direct status if not a derived status
                query += ` AND c.status = $2`;
                params.push(status);
            }
        }

        query += ` ORDER BY c.created_at DESC`;

        const coupons = await db.any(query, params);

        res.json({
            success: true,
            coupons
        });

    } catch (error) {
        console.error('Error fetching package coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch package coupons',
            error: error.message
        });
    }
});

// Delete a coupon (admin)
export const deleteCoupon = asyncHandler(async (req, res) => {
    const { coupon_id } = req.params;

    try {
        // Check if coupon exists
        const coupon = await db.oneOrNone(
            'SELECT coupon_id FROM coupons WHERE coupon_id = $1',
            [coupon_id]
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon has been used
        const usageCount = await db.one(
            'SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1',
            [coupon_id]
        );

        if (parseInt(usageCount.count) > 0) {
            // If used, just deactivate instead of deleting
            await db.none(
                'UPDATE coupons SET status = $1 WHERE coupon_id = $2',
                ['inactive', coupon_id]
            );

            return res.json({
                success: true,
                message: 'Coupon deactivated successfully (was previously used)'
            });
        }

        // Delete the coupon if never used
        await db.none('DELETE FROM coupons WHERE coupon_id = $1', [coupon_id]);

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete coupon',
            error: error.message 
        });
    }
});