import express from "express";
import {
    getDashboardStats,
    getStatsOverTime,
    getUsers,
    getPosts,
    getCommunities,
    getPackages,
    updateUserRole,
    deleteContent,
} from "../controllers/adminController.js";
import {
    checkJwtMiddleware,
    requireRole,
} from "../middleware/authMiddleware.js";

// Import admin sub-routes
import adminPackageRoutes from './admin/adminPackageRoutes.js';
import adminBookingRoutes from './admin/adminBookingRoutes.js';
import adminInvoiceRoutes from './admin/adminInvoiceRoutes.js';
import adminPaymentRoutes from './admin/adminPaymentRoutes.js';

const router = express.Router();
router.use(checkJwtMiddleware, requireRole("admin"));

router.get("/stats", getDashboardStats);
router.get("/stats/over-time", getStatsOverTime);
router.get("/users", getUsers);
router.get("/posts", getPosts);
router.get("/communities", getCommunities);
router.get("/packages", getPackages); // Changed from POST to GET
router.put("/users/:userId/role", updateUserRole);
router.delete("/:type/:id", deleteContent);

// Mount admin sub-routes
router.use('/packages', adminPackageRoutes);
router.use('/bookings', adminBookingRoutes);
router.use('/invoices', adminInvoiceRoutes);
router.use('/payments', adminPaymentRoutes);

export default router;