// tempo/backend/src/services/amadeus.js
const Amadeus = require('amadeus');

// Ensure your .env file has AMADEUS_API_KEY and AMADEUS_API_SECRET
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
});

// Log to confirm the service is initializing
console.log("✈️ Amadeus service initialized.");

module.exports = amadeus;
