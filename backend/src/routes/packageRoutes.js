import express from 'express';
import { 
    searchPublicPackages,
    getPublicPackageDetails,
    bookPackage
} from '../controllers/packageController.js';
import { checkJwtMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public package routes (no authentication required)
router.get('/search', searchPublicPackages);
router.get('/:packageId', getPublicPackageDetails);

// Protected package routes (authentication required)
router.post('/book', checkJwtMiddleware, bookPackage);

export default router;
