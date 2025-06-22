-- findOrCreateLocation.sql
-- $1 = latitude, $2 = longitude, $3 = location_name, $4 = country, $5 = description|null
WITH existing AS (
  SELECT location_id
  FROM location
  WHERE latitude  = $1
    AND longitude = $2
    AND location_name ILIKE $3
    AND country       ILIKE $4
)
, inserted AS (
  INSERT INTO location (latitude, longitude, location_name, country, description)
  SELECT $1, $2, $3, $4, $5
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING location_id
)
SELECT
  (CASE
     WHEN EXISTS (SELECT 1 FROM existing) THEN (SELECT location_id FROM existing)
     ELSE      (SELECT location_id FROM inserted)
   END) AS location_id;
