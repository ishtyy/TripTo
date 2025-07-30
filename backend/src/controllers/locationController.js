import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Existing findOrCreateLocation function (no changes needed)
export const findOrCreateLocation = asyncHandler(async (req, res) => {
    const {
        location_name,
        country,
        latitude,
        longitude,
        description,
        iata_code,
        tolerance_meters = 10,
    } = req.body;

    if (!location_name || !country || latitude == null || longitude == null) {
        res.status(400);
        throw new Error('location_name, country, latitude, and longitude are required');
    }

    const point = `SRID=4326;POINT(${longitude} ${latitude})`;

    let location = null;
    if (iata_code) {
        location = await db.oneOrNone('SELECT * FROM locations WHERE iata_code = $1', [iata_code]);
    }

    if (!location) {
        location = await db.oneOrNone(
            `
            SELECT *
            FROM locations
            WHERE ST_DWithin(
                coordinates,
                ST_GeogFromText($1),
                $2
            )
            LIMIT 1
            `,
            [point, tolerance_meters]
        );
    }

    if (location) {
        console.log(`[findOrCreateLocation] Reusing existing location: ${location.location_id} (IATA: ${location.iata_code || 'N/A'})`);
        if (iata_code && !location.iata_code) {
             await db.none('UPDATE locations SET iata_code = $1 WHERE location_id = $2', [iata_code, location.location_id]);
             location.iata_code = iata_code;
        }
        return res.json({ location, reused: true });
    }

    location = await db.one(
        `
        INSERT INTO locations (
            location_name,
            country,
            latitude,
            longitude,
            description,
            coordinates,
            iata_code
        ) VALUES (
            $1, $2, $3, $4, $5,
            ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography,
            $6
        )
        RETURNING *
        `,
        [
            location_name.trim(),
            country.trim(),
            latitude,
            longitude,
            description || null,
            iata_code || null,
        ]
    );

    res.status(201).json({ location, reused: false });
});


// NEW FUNCTION: importAirportsFromJson - FINAL DEBUG VERSION
export const importAirportsFromJson = asyncHandler(async (req, res) => {
    console.log("\n--- STARTING AIRPORT DATA IMPORT (DEBUG MODE) ---");
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const airportsPath = path.join(__dirname, '..', 'data', 'airports.json');
        console.log("DEBUG: Attempting to read airports.json from:", airportsPath);

        let data;
        try {
            data = await fs.readFile(airportsPath, 'utf8');
            console.log("DEBUG: Successfully read airports.json file.");
        } catch (readError) {
            console.error("ERROR: Could not read airports.json file:", readError.message);
            return res.status(500).json({ error: 'Failed to read airports.json: ' + readError.message });
        }

        let airports;
        try {
            airports = JSON.parse(data);
            console.log(`DEBUG: Successfully parsed JSON. Found ${airports.length} airports.`);
        } catch (parseError) {
            console.error("ERROR: Could not parse airports.json file:", parseError.message);
            return res.status(500).json({ error: 'Failed to parse airports.json: ' + parseError.message });
        }

        let importedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        const failedAirports = [];

        console.log("DEBUG: Starting database transaction for import...");
        await db.tx(async t => {
            for (const airport of airports) {
                // Basic validation of airport object structure
                if (!airport || !airport.iata || !airport.name || airport.lat === undefined || airport.lon === undefined) {
                    console.warn(`WARN: Skipping malformed airport entry: ${JSON.stringify(airport)}`);
                    failedCount++;
                    failedAirports.push({ data: airport, reason: "Malformed entry" });
                    continue;
                }

                const lat = parseFloat(airport.lat);
                const lon = parseFloat(airport.lon);

                if (isNaN(lat) || isNaN(lon)) {
                    console.warn(`WARN: Skipping airport ${airport.iata} due to invalid lat/lon: lat=${airport.lat}, lon=${airport.lon}`);
                    failedCount++;
                    failedAirports.push({ iata: airport.iata, reason: `Invalid lat/lon: lat=${airport.lat}, lon=${airport.lon}` });
                    continue;
                }

                try {
                    const existing = await t.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [airport.iata]);

                    if (!existing) {
                        console.log(`DEBUG: Attempting INSERT for ${airport.iata} (${airport.name})...`);
                        await t.none(
                            `INSERT INTO locations (
                                location_name, country, latitude, longitude, iata_code, coordinates
                            ) VALUES (
                                $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography
                            ) ON CONFLICT (iata_code) DO NOTHING`,
                            [
                                airport.name,
                                airport.country,
                                lat,
                                lon,
                                airport.iata
                            ]
                        );
                        // Verify if insert actually happened by re-querying
                        const inserted = await t.oneOrNone('SELECT location_id FROM locations WHERE iata_code = $1', [airport.iata]);
                        if (inserted) {
                           importedCount++;
                           console.log(`DEBUG: Successfully INSERTED ${airport.iata}.`);
                        } else {
                           skippedCount++; // Was skipped by ON CONFLICT (shouldn't happen if !existing)
                           console.log(`DEBUG: INSERT for ${airport.iata} was skipped by ON CONFLICT (unexpected for !existing).`);
                        }
                    } else {
                        skippedCount++;
                        console.log(`DEBUG: Skipping ${airport.iata} (already exists).`);
                    }
                } catch (insertError) {
                    console.error(`ERROR: Database INSERT failed for ${airport.iata}:`, insertError.message);
                    failedCount++;
                    failedAirports.push({ iata: airport.iata, reason: insertError.message });
                }
            }
        });
        console.log("DEBUG: Database transaction completed.");

        console.log("\n--- AIRPORT DATA IMPORT SUMMARY ---");
        console.log(`Imported: ${importedCount}`);
        console.log(`Skipped (already exists): ${skippedCount}`);
        console.log(`Failed: ${failedCount}`);
        if (failedAirports.length > 0) {
            console.log("Details of failed airports:", failedAirports);
        }
        console.log("--- IMPORT END ---");

        res.status(200).json({
            message: `Airport data import complete. Imported: ${importedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}.`,
            importedCount,
            skippedCount,
            failedCount,
            failedAirports
        });

    } catch (error) {
        console.error("CRITICAL IMPORT ERROR (outside transaction loop):", error);
        res.status(500).json({ error: 'Failed to import airport data: ' + error.message });
    }
});

// Search locations by query
export const searchLocations = asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }
    
    try {
        const searchQuery = `
            SELECT location_id, location_name, country, iata_code, latitude, longitude
            FROM locations 
            WHERE 
                location_name ILIKE $1 
                OR country ILIKE $1 
                OR iata_code ILIKE $2
            ORDER BY 
                CASE 
                    WHEN iata_code ILIKE $2 THEN 1
                    WHEN location_name ILIKE $3 THEN 2
                    ELSE 3
                END,
                location_name
            LIMIT $4
        `;
        
        const searchPattern = `%${q.trim()}%`;
        const exactPattern = `${q.trim().toUpperCase()}%`;
        
        const locations = await db.any(searchQuery, [
            searchPattern,  // $1
            exactPattern,   // $2
            exactPattern,   // $3
            parseInt(limit) // $4
        ]);
        
        res.json({ locations });
    } catch (error) {
        console.error('Location search error:', error);
        res.status(500).json({ error: 'Failed to search locations' });
    }
});