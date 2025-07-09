import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const findOrCreateLocation = asyncHandler(async (req, res) => {
  const {
    location_name,
    country,
    latitude,
    longitude,
    description,
    tolerance_meters = 10, // default tolerance
  } = req.body;

  if (!location_name || !country || latitude == null || longitude == null) {
    res.status(400);
    throw new Error('location_name, country, latitude, and longitude are required');
  }

  // Prepare point for comparison
  const point = `SRID=4326;POINT(${longitude} ${latitude})`;

  // First: find if there’s already a location within X meters
  let location = await db.oneOrNone(
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

  if (location) {
    console.log(`Reusing existing location: ${location.location_id}`);
    return res.json({ location, reused: true });
  }

  // Else: insert new location
  location = await db.one(
    `
    INSERT INTO locations (
      location_name,
      country,
      latitude,
      longitude,
      description,
      coordinates
    ) VALUES (
      $1, $2, $3, $4, $5,
      ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography
    )
    RETURNING *
    `,
    [
      location_name.trim(),
      country.trim(),
      latitude,
      longitude,
      description || null,
    ]
  );

  res.status(201).json({ location, reused: false });
});
