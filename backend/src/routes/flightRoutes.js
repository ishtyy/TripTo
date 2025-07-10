import express from 'express';
// ✅ Import our new generator function
import { generateFlightSchedules, searchLocations } from '../controllers/flightController.js';

const router = express.Router();

// This route still handles the autocomplete for locations
router.route('/search-locations').get(searchLocations);

// ✅ This route now uses a POST request to generate schedules
router.route('/generate-schedules').post(generateFlightSchedules);

export default router;