import express from 'express';
import {
    createInvoiceFromBooking,
    getInvoiceWithItems
} from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/from-booking/:bookingId', createInvoiceFromBooking);
router.get('/:invoiceId', getInvoiceWithItems);
export default router;
