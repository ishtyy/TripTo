import express from 'express';
import {
    createFlight,
    createAccommodation,
    createActivity,
    createPackage,
    addModuleToPackage,
    // createCompletePackage, // Temporarily commented out - function missing
    // getPackageDetails,     // Temporarily commented out - function missing  
    // updatePackage,         // Temporarily commented out - function missing
} from '../../controllers/packageController.js';
import db from '../../config/db.js';

const router = express.Router();

// Test endpoint to verify database connection and enum values
router.get('/test-db', async (req, res) => {
    try {
        // Test basic connection
        const test = await db.one('SELECT 1 as test');
        
        // Test enum values
        const enumValues = await db.any(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid 
                FROM pg_type 
                WHERE typname = 'activity_type'
            )
        `);
        
        // Test PostGIS
        const postgisTest = await db.oneOrNone('SELECT PostGIS_Version() as version');
        
        res.json({ 
            success: true, 
            database: test,
            activity_types: enumValues.map(e => e.enumlabel),
            postgis: postgisTest
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code 
        });
    }
});

// Note: Auth middleware already applied at parent router level in adminRoutes.js
router.post('/flight', createFlight);
router.post('/accommodation', createAccommodation);
router.post('/activity', createActivity);
router.post('/', createPackage);
// router.post('/complete', createCompletePackage); // Temporarily commented out - function missing
router.post('/:packageId/modules', addModuleToPackage);

// Package details and update routes - temporarily commented out
// router.get('/:packageId/details', getPackageDetails);
// router.put('/:packageId', updatePackage);

export default router;
