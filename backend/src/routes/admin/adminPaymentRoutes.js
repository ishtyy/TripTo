import express from 'express';
import { getAllPayments } from '../../controllers/adminPaymentController.js';

const router = express.Router();

// Note: Auth middleware already applied at parent router level in adminRoutes.js
router.get('/', getAllPayments);

export default router;