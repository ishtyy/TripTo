import express from 'express';
import { findOrCreateLocation, importAirportsFromJson } from '../controllers/locationController.js'; // Import new function
import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js'; // Assuming you want this protected

const router = express.Router();

// Fix: Add the find-or-create route that the frontend expects
router.route('/find-or-create').post(checkJwtMiddleware, findOrCreateLocation);

// Keep the original route as well for backwards compatibility
router.route('/').post(checkJwtMiddleware, findOrCreateLocation);

// New route for importing airport data - protect it with admin role
router.route('/import-airports').post(checkJwtMiddleware, requireRole('admin'), importAirportsFromJson);

export default router;