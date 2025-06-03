// backend/src/routes/locationRoutes.js
const express = require('express');
// const { v4: uuidv4 } = require('uuid'); // No longer needed if DB generates ID
const supabase = require('../config/supabaseClient');
const { checkJwtMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/locations/find-or-create
 * Body: { latitude, longitude, location_name, country, description (optional) }
 */
router.post('/find-or-create', checkJwtMiddleware, async (req, res) => {
    const { latitude, longitude, location_name, country, description } = req.body;

    if (latitude === undefined || longitude === undefined || !location_name || !country) {
        return res.status(400).json({ error: 'Latitude, longitude, location_name, and country are required.' });
    }

    try {
        let { data: existingLocation, error: findError } = await supabase
            .from('location')
            .select('location_id')
            .eq('latitude', parseFloat(latitude))
            .eq('longitude', parseFloat(longitude))
            .ilike('location_name', location_name.trim())
            .ilike('country', country.trim())
            .maybeSingle(); 

        if (findError) {
            console.error('Error finding location:', findError);
            return res.status(500).json({ error: 'Database error while searching for location.' });
        }

        if (existingLocation) {
            return res.json({ location_id: existingLocation.location_id, existed: true });
        }

        // const newLocationId = uuidv4(); // REMOVE THIS
        const newLocationData = {
            // location_id: newLocationId, // REMOVE THIS (DB will generate it)
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            location_name: location_name.trim(),
            country: country.trim(),
            description: description ? description.trim() : null,
        };

        const { data: insertedLocation, error: insertError } = await supabase
            .from('location')
            .insert(newLocationData)
            .select('location_id') // Select to confirm insertion and get the generated ID
            .single();

        if (insertError) {
            console.error('Error inserting new location:', insertError);
            if (insertError.code === '23505') { 
                return res.status(409).json({ error: 'Location entry conflict. It might have just been created.' });
            }
            return res.status(500).json({ error: 'Failed to create new location.' });
        }
        
        if (!insertedLocation || !insertedLocation.location_id) { // Check if location_id is returned
             console.error('Failed to create new location (no location_id returned after insert). Inserted data:', insertedLocation);
             return res.status(500).json({ error: 'Failed to create new location (no location_id returned after insert).' });
        }

        return res.status(201).json({ location_id: insertedLocation.location_id, existed: false });

    } catch (err) {
        console.error('Find-or-create location unexpected error:', err);
        res.status(500).json({ error: 'An unexpected error occurred while processing the location.' });
    }
});

module.exports = router;
