// src/routes/paymentRoutes.js

import express from 'express';
import {
  createPayment,
  getPaymentById,
  getPaymentsByInvoice
} from '../controllers/paymentController.js';

const router = express.Router();

// Create a payment for an invoice item
router.post('/', createPayment);

// Get a specific payment by ID
router.get('/:id', getPaymentById);

// Get all payments for a given invoice
router.get('/invoice/:invoiceId', getPaymentsByInvoice);

export default router;
