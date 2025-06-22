// backend/src/routes/locationRoutes.js
const express = require('express');
const db = require('../config/db');
const { checkJwtMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', async (req, res, next) => {
    const { q } = req.query;
    try {
        let query = 'SELECT * FROM location';
        const params = [];
        if (q) {
            query += ' WHERE location_name ILIKE $1 OR country ILIKE $1';
            params.push(`%${q}%`);
        }
        query += ' ORDER BY location_name';

        const { rows } = await db.query(query, params);
        res.json({ locations: rows });
    } catch (err) {
        next(err);
    }
});


// This endpoint is not implemented but is kept for future use.
router.get('/', async (req, res) => {
    res.status(501).json({ error: 'Not Implemented' });
});

router.post('/find-or-create', checkJwtMiddleware, async (req, res) => {
    const { latitude, longitude, location_name, country, description } = req.body;

    if (latitude === undefined || longitude === undefined || !location_name || !country) {
        return res.status(400).json({ error: 'Latitude, longitude, location_name, and country are required.' });
    }

    const floatLat = parseFloat(latitude);
    const floatLon = parseFloat(longitude);

    try {
        // First, try to find the location based on the unique coordinates
        const findQuery = 'SELECT location_id FROM location WHERE latitude = $1 AND longitude = $2';
        const { rows: existingRows } = await db.query(findQuery, [floatLat, floatLon]);

        if (existingRows.length > 0) {
            // Location already exists, return its ID
            return res.json({ location_id: existingRows[0].location_id, existed: true });
        }

        // If it doesn't exist, insert it
        const insertQuery = `
            INSERT INTO location (latitude, longitude, location_name, country, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING location_id
        `;
        const insertValues = [floatLat, floatLon, location_name.trim(), country.trim(), description ? description.trim() : null];
        const { rows: insertedRows } = await db.query(insertQuery, insertValues);

        return res.status(201).json({ location_id: insertedRows[0].location_id, existed: false });

    } catch (err) {
        // This catch block handles a "race condition"
        // If the error is a unique violation, it means another request created the location
        // between our SELECT and INSERT. In that case, we can safely re-query for the now-existing location.
        if (err.code === '23505' && err.constraint === 'location_lat_lon_unique') {
            console.log('Race condition detected, re-fetching existing location.');
            try {
                const findQuery = 'SELECT location_id FROM location WHERE latitude = $1 AND longitude = $2';
                const { rows: raceRows } = await db.query(findQuery, [floatLat, floatLon]);
                if (raceRows.length > 0) {
                    return res.json({ location_id: raceRows[0].location_id, existed: true });
                }
            } catch (refetchErr) {
                 console.error('Find-or-create location re-fetch error after race condition:', refetchErr);
                 return res.status(500).json({ error: 'An unexpected error occurred while processing the location.' });
            }
        }

        console.error('Find-or-create location unexpected error:', err);
        res.status(500).json({ error: 'An unexpected error occurred while processing the location.' });
    }
});

module.exports = router;