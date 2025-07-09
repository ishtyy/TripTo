// src/controllers/invoiceController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';


// A sample discount rule — extend this as needed
function getDiscountForItem(bookableItemId) {
    // For example, flat 10% off activities
    const activityDiscounts = {
        'activity': 0.10,
        'flight': 0.00,
        'accommodation': 0.00,
        'package': 0.05
    };
    // In a real case, you'd fetch the type from bookable_item
    return activityDiscounts['activity'] || 0; // fallback
}

// POST /api/invoices/from-booking/:bookingId
export const createInvoiceFromBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    // Check booking exists
    const booking = await db.oneOrNone(`SELECT * FROM booking WHERE booking_id = $1`, [bookingId]);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Check if invoice already exists for this booking
    const existing = await db.oneOrNone(
        `SELECT * FROM invoice WHERE booking_id = $1`,
        [bookingId]
    );
    if (existing) {
        res.status(400);
        throw new Error('Invoice already exists for this booking');
    }

    // 1. Create the invoice
    const invoice = await db.one(
        `INSERT INTO invoice (booking_id)
     VALUES ($1)
     RETURNING invoice_id` ,
        [bookingId]
    );

    const invoiceId = invoice.invoice_id;

    // 2. Get booking items
    const items = await db.any(
        `SELECT * FROM booking_item WHERE booking_id = $1`,
        [bookingId]
    );

    // 3. Insert invoice items
    const invoiceItemPromises = items.map(item => {
        const { bookable_item_id, price_at_booking } = item;
        const base_price = Number(price_at_booking);
        const discount = 0; // placeholder — add your logic here
        const final_price = base_price - discount;

        return db.none(
            `INSERT INTO invoice_item (
         invoice_id, bookable_item_id, base_price, discount, final_price
       ) VALUES ($1, $2, $3, $4, $5)`,
            [invoiceId, bookable_item_id, base_price, discount, final_price]
        );
    });

    await Promise.all(invoiceItemPromises);

    res.status(201).json({ success: true, invoice_id: invoiceId });
});
// GET /api/invoices/:invoiceId
export const getInvoiceWithItems = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;

    const invoice = await db.oneOrNone(
        `SELECT * FROM invoice WHERE invoice_id = $1`,
        [invoiceId]
    );
    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }

    const items = await db.any(
        `SELECT ii.*, b.title, b.type
     FROM invoice_item ii
     JOIN bookable_item b ON ii.bookable_item_id = b.bookable_item_id
     WHERE ii.invoice_id = $1`,
        [invoiceId]
    );

    res.json({ ...invoice, items });
});

// GET /api/invoices (admin view)
export const listAllInvoices = asyncHandler(async (_req, res) => {
    const invoices = await db.any(
        `SELECT i.*, u.name as user_name
     FROM invoice i
     JOIN booking b ON i.booking_id = b.booking_id
     JOIN user_profiles u ON b.user_id = u.user_id
     ORDER BY i.issued_at DESC`
    );

    res.json(invoices);
});

// GET /api/invoices (admin view with optional filters)
export const listAllInvoicesWithFilters = asyncHandler(async (req, res) => {
    const { status, user_id, from, to, sort_by = 'issued_at', order = 'desc' } = req.query;
    const conditions = [];
    const values = [];

    if (status) {
        conditions.push(`i.overall_status = $${values.length + 1}`);
        values.push(status);
    }
    if (user_id) {
        conditions.push(`u.user_id = $${values.length + 1}`);
        values.push(user_id);
    }
    if (from) {
        conditions.push(`i.issued_at >= $${values.length + 1}`);
        values.push(from);
    }
    if (to) {
        conditions.push(`i.issued_at <= $${values.length + 1}`);
        values.push(to);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSorts = ['issued_at', 'overall_status', 'invoice_id'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'issued_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const invoices = await db.any(
        `SELECT i.*, u.name as user_name
     FROM invoice i
     JOIN booking b ON i.booking_id = b.booking_id
     JOIN user_profiles u ON b.user_id = u.user_id
     ${whereClause}
     ORDER BY i.${sortColumn} ${sortOrder}`,
        values
    );

    res.json(invoices);
});
