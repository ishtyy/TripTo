import express from "express";
import {
    getDashboardStats,
    getStatsOverTime,
    getUsers,
    getPosts,
    getCommunities,
    getBookings,
    updateUserRole,
    deleteContent,
    updateBookingStatus,
    getBookingDetails, // New: Import the new function
} from "../controllers/adminController.js";
import {
    checkJwtMiddleware,
    requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(checkJwtMiddleware, requireRole("admin"));

router.get("/stats", getDashboardStats);
router.get("/stats/over-time", getStatsOverTime);
router.get("/users", getUsers);
router.get("/posts", getPosts);
router.get("/communities", getCommunities);
router.get("/bookings", getBookings);
router.get("/bookings/:bookingId", getBookingDetails); // New: Route for single booking details
router.put("/users/:userId/role", updateUserRole);
router.put("/bookings/:bookingId/status", updateBookingStatus);
router.delete("/:type/:id", deleteContent);

export default router;