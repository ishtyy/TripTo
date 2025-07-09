// src/routes/adminRoutes.js
import express from 'express';
import adminBookingRoutes from './admin/adminBookingRoutes.js';
import adminPackageRoutes from './admin/adminPackageRoutes.js';
import adminInvoiceRoutes from './admin/adminInvoiceRoutes.js';
import adminPaymentRoutes from './admin/adminPaymentRoutes.js';

const router = express.Router();

router.use('/bookings', adminBookingRoutes);
router.use('/packages', adminPackageRoutes);
router.use('/invoices', adminInvoiceRoutes);
router.use('/payments', adminPaymentRoutes);

export default router;
