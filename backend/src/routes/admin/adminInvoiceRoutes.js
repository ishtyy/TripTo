import express from 'express';
import {
    listAllInvoices,
    listAllInvoicesWithFilters
} from '../../controllers/invoiceController.js';

const router = express.Router();

// Note: Auth middleware already applied at parent router level in adminRoutes.js
router.get('/', listAllInvoices);
router.get('/filters', listAllInvoicesWithFilters);

export default router;
