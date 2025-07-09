import express from 'express';
import {
  createBooking,
  getBookingById,
  getBookingsByUser
} from '../controllers/bookingController.js';
import { checkJwtMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', checkJwtMiddleware, createBooking);
router.get('/:id', checkJwtMiddleware, getBookingById);
router.get('/user/:userId', checkJwtMiddleware, getBookingsByUser);

export default router;
