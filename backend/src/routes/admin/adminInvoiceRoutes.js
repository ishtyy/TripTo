import express from 'express';
import {
    listAllInvoices,
    listAllInvoicesWithFilters
} from '../../controllers/invoiceController.js';
import { checkJwtMiddleware, requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', checkJwtMiddleware, requireRole('admin'), listAllInvoices);
router.get('/filters', checkJwtMiddleware, requireRole('admin'), listAllInvoicesWithFilters);

export default router;
