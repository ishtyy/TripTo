// tempo/backend/src/routes/flightRoutes.js
const express = require('express');
const Amadeus = require('amadeus');
const amadeus = require('../services/amadeus');

const router = express.Router();

// This endpoint is for when the user types in the search box.
router.get('/search-locations', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword || keyword.length < 2) {
    return res.status(400).json({ error: 'Keyword is required.' });
  }
  const searchKeyword = keyword.toUpperCase();
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: searchKeyword,
      subType: [Amadeus.location.CITY, Amadeus.location.AIRPORT],
    });
    res.json({ locations: response.data });
  } catch (err) {
    console.error("[flightRoutes] /search-locations error:", err.response?.data || err.message);
    res.status(err.response?.statusCode || 500).json({ error: "Failed to fetch locations." });
  }
});

// This endpoint is for when the user clicks on the map.
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


// This endpoint finds flight deals.
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