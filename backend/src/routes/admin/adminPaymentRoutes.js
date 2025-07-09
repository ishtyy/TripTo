import express from 'express';
import { checkJwtMiddleware, requireRole } from '../../middleware/authMiddleware.js';
import { getAllPayments } from '../../controllers/adminPaymentController.js';

const router = express.Router();

router.get(
  '/',
  checkJwtMiddleware,
  requireRole('admin'),
  getAllPayments
);

export default router;