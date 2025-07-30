import express from 'express';
import { getHotels, getHotelDetails, bookHotelRoom, getPopularHotels } from '../controllers/hotelController.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getHotels);
router.get('/search', getHotels); // Alias for hotel search
router.get('/popular', getPopularHotels);
router.get('/:hotelId', getHotelDetails);

// Protected routes
router.post('/book', checkJwtMiddleware, bookHotelRoom);

export default router;
