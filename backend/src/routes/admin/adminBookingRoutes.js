import express from 'express';
import { getAllBookings } from '../../controllers/bookingController.js';
import { checkJwtMiddleware, requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/',
  checkJwtMiddleware,
  requireRole('admin'),
  getAllBookings
);

export default router;
