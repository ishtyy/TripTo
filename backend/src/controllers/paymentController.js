// src/controllers/paymentController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// POST /api/payments
export const createPayment = asyncHandler(async (req, res) => {
    const { invoice_item_id, amount, method } = req.body;

    const result = await db.one(
        `INSERT INTO payment (invoice_item_id, amount, method)
     VALUES ($1, $2, $3)
     RETURNING payment_id, status, payment_date` ,
        [invoice_item_id, amount, method]
    );

    // Update invoice_item payment status based on total paid
    const totalPaid = await db.one(
        `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payment
     WHERE invoice_item_id = $1 AND status = 'completed'`,
        [invoice_item_id]
    );

    const { base_price, discount, final_price, invoice_id } = await db.one(
        `SELECT base_price, discount, final_price, invoice_id
     FROM invoice_item
     WHERE invoice_item_id = $1`,
        [invoice_item_id]
    );

    let newStatus = 'unpaid';
    if (Number(totalPaid.total) >= final_price) {
        newStatus = 'paid';
    } else if (Number(totalPaid.total) > 0) {
        newStatus = 'partially_paid';
    }

    await db.none(
        `UPDATE invoice_item SET payment_status = $1 WHERE invoice_item_id = $2`,
        [newStatus, invoice_item_id]
    );

    // Check if all invoice items are paid
    const unpaidItems = await db.one(
        `SELECT COUNT(*) AS count
     FROM invoice_item
     WHERE invoice_id = $1 AND payment_status != 'paid'`,
        [invoice_id]
    );

    if (Number(unpaidItems.count) === 0) {
        await db.tx(async t => {
            await t.none(
                `UPDATE invoice SET overall_status = 'paid' WHERE invoice_id = $1`,
                [invoice_id]
            );
            await t.none(
                `UPDATE booking SET status = 'approved'
         WHERE booking_id = (SELECT booking_id FROM invoice WHERE invoice_id = $1)`,
                [invoice_id]
            );
        });
    } else {
        await db.none(
            `UPDATE invoice SET overall_status = 'partially_paid' WHERE invoice_id = $1`,
            [invoice_id]
        );
    }

    res.status(201).json({ success: true, ...result });
});

// GET /api/payments/:id
export const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await db.oneOrNone(
        `SELECT * FROM payment WHERE payment_id = $1`,
        [req.params.id]
    );

    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }

    res.json(payment);
});

// GET /api/payments/invoice/:invoiceId
export const getPaymentsByInvoice = asyncHandler(async (req, res) => {
    const payments = await db.any(
        `SELECT * FROM payment
     WHERE invoice_item_id IN (
       SELECT invoice_item_id FROM invoice_item WHERE invoice_id = $1
     )
     ORDER BY payment_date DESC`,
        [req.params.invoiceId]
    );

    res.json(payments);
});
