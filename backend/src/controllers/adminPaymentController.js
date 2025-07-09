// src/controllers/adminPaymentController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * GET /api/admin/payments
 * Admin: Get all payments, with optional filters
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { from, to, user_id, invoice_id, method, status } = req.query;

  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`p.payment_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`p.payment_date <= $${params.length}`);
  }
  if (user_id) {
    params.push(user_id);
    conditions.push(`u.user_id = $${params.length}`);
  }
  if (invoice_id) {
    params.push(invoice_id);
    conditions.push(`ii.invoice_id = $${params.length}`);
  }
  if (method) {
    params.push(method);
    conditions.push(`p.method = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      p.*, 
      ii.invoice_id,
      u.user_id,
      u.username,
      u.email
    FROM payment p
    JOIN invoice_item ii ON p.invoice_item_id = ii.invoice_item_id
    JOIN invoice i ON ii.invoice_id = i.invoice_id
    JOIN booking b ON i.booking_id = b.booking_id
    JOIN user_profiles u ON b.user_id = u.user_id
    ${whereClause}
    ORDER BY p.payment_date DESC
  `;

  const payments = await db.any(query, params);

  res.json({ payments });
});
