import express from 'express';
import {
    createFlight,
    createAccommodation,
    createActivity,
    createPackage,
    addModuleToPackage,
} from '../../controllers/packageController.js';
import { checkJwtMiddleware, requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/flight', checkJwtMiddleware, requireRole('admin'), createFlight);
router.post('/accommodation', checkJwtMiddleware, requireRole('admin'), createAccommodation);
router.post('/activity', checkJwtMiddleware, requireRole('admin'), createActivity);
router.post('/', checkJwtMiddleware, requireRole('admin'), createPackage);
router.post('/:packageId/modules', checkJwtMiddleware, requireRole('admin'), addModuleToPackage);

export default router;
