import express from 'express';
import { findOrCreateLocation } from '../controllers/locationController.js';

const router = express.Router();

router.post('/find-or-create', findOrCreateLocation);

export default router;
