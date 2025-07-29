// src/routes/couponRoutes.js

import express from 'express';
import { 
    createBookingFlightCoupon,
    applyCoupon,
    useCoupon,
    getUserCoupons,
    getAllCoupons,
    getPackageCoupons,
    deleteCoupon
} from '../controllers/couponController.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create flight discount coupon for booking
router.post('/create-booking-flight-coupon', createBookingFlightCoupon);

// Validate and apply coupon to calculate discount
router.post('/apply', applyCoupon);

// Record coupon usage after successful booking
router.post('/use', useCoupon);

// Get current user's available coupons (authenticated route)
router.get('/my-coupons', checkJwtMiddleware, (req, res) => {
    req.params.user_id = req.user.user_id;
    getUserCoupons(req, res);
});

// Get user's available coupons (by user_id)
router.get('/user/:user_id', getUserCoupons);

// Admin: Get all coupons with statistics
router.get('/admin/all', getAllCoupons);

// Get coupons for a specific package
router.get('/package/:package_id', getPackageCoupons);

// Delete a coupon
router.delete('/:coupon_id', deleteCoupon);

export default router;
