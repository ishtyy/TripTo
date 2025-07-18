import express from 'express';
import { findOrCreateLocation, importAirportsFromJson } from '../controllers/locationController.js'; // Import new function
import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js'; // Assuming you want this protected

const router = express.Router();

router.route('/').post(checkJwtMiddleware, findOrCreateLocation);

// New route for importing airport data - protect it with admin role
router.route('/import-airports').post(checkJwtMiddleware, requireRole('admin'), importAirportsFromJson);

export default router;