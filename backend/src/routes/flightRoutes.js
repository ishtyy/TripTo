// tempo/backend/src/routes/flightRoutes.js
const express = require('express');
const Amadeus = require('amadeus'); // This import is necessary
const amadeus = require('../services/amadeus'); // This is your initialized SDK

const router = express.Router();

/**
 * Endpoint for text search (autocomplete)
 * GET /api/flights/search-locations?keyword=...
 */
router.get('/search-locations', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword || keyword.length < 2) {
    // Return 200 with empty array for short keywords instead of an error
    return res.json({ locations: [] });
  }
  const searchKeyword = keyword.toUpperCase();

  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: searchKeyword,
      // THIS IS THE FIX: Explicitly tell Amadeus to search for both cities and airports.
      subType: [Amadeus.location.CITY, Amadeus.location.AIRPORT],
    });
    res.json({ locations: response.data });
  } catch (err) {
    console.error("[flightRoutes] /search-locations error:", err.response?.data || err.message);
    res.status(err.response?.statusCode || 500).json({ error: "Failed to fetch locations." });
  }
});

/**
 * Endpoint for map clicks
 * GET /api/flights/search-by-coords?lat=...&lng=...
 */
router.get('/search-by-coords', async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and Longitude are required."});
    }

    try {
        const response = await amadeus.referenceData.locations.airports.get({
            latitude: lat,
            longitude: lng,
            radius: 50, // Search within a 50km radius
        });
        res.json({ locations: response.data });
    } catch(err) {
        console.error("[flightRoutes] /search-by-coords error:", err.response?.data || err.message);
        res.status(err.response?.statusCode || 500).json({ error: "Failed to find airports near coordinates."});
    }
});


/**
 * Endpoint for finding flight deals
 * GET /api/flights/offers?origin=...&destination=...&date=...
 */
router.get('/offers', async (req, res) => {
  const { origin, destination, date } = req.query;
  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'Origin, destination, and date are required.' });
  }
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: '1',
      max: 10,
    });
    res.json({ offers: response.data, dictionaries: response.result.dictionaries });
  } catch (err) {
    console.error("[flightRoutes] /offers error:", err.response?.data || err.message);
    res.status(err.response?.statusCode || 500).json({ error: "Failed to fetch flight offers." });
  }
});

module.exports = router;
