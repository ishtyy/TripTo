import asyncHandler from 'express-async-handler';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // Import helper for ES Modules

// This is the only function that needs to change.
const searchLocations = asyncHandler(async (req, res) => {
  const { keyword } = req.query;
  if (!keyword || keyword.length < 1) {
    return res.json({ locations: [] });
  }

  try {
    // ✅ FIX: Construct a reliable path to the data file INSIDE the backend project.
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const airportsPath = path.join(__dirname, '..', 'data', 'airports.json');
    
    const data = await fs.readFile(airportsPath, 'utf8');
    const airports = JSON.parse(data);

    const searchLower = keyword.toLowerCase();
    const results = airports.filter(airport => 
      airport.name.toLowerCase().includes(searchLower) ||
      airport.city.toLowerCase().includes(searchLower) ||
      airport.iata.toLowerCase().includes(searchLower)
    ).slice(0, 10);

    const mappedLocations = results.map(item => ({
      id: item.iata,
      name: item.name,
      iataCode: item.iata,
      address: {
        cityName: item.city,
        countryName: item.country,
      },
    }));

    res.json({ locations: mappedLocations });

  } catch (error) {
    console.error("Error reading or parsing airports.json:", error);
    res.status(500).json({ error: 'Failed to load airport data.' });
  }
});


// --- The flight generator logic remains exactly the same ---
const DUMMY_AIRLINES = [ { name: 'TripTo Airways', code: 'TA' }, { name: 'Tempo Flights', code: 'TP' }, { name: 'Quantum Jets', code: 'QJ' }];
const TRANSIT_HUBS = [ { name: 'Dubai Intl', iataCode: 'DXB' }, { name: 'Hamad Intl', iataCode: 'DOH' }, { name: 'Changi Airport', iataCode: 'SIN' } ];

const generateFlightsForDay = (origin, destination, date) => {
    const flights = [];
    const numFlights = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numFlights; i++) {
        const airline = DUMMY_AIRLINES[Math.floor(Math.random() * DUMMY_AIRLINES.length)];
        const departureTime = new Date(date);
        departureTime.setUTCHours(Math.floor(Math.random() * 18) + 6, Math.floor(Math.random() * 60));
        const legs = [];
        let finalArrivalTime = new Date(departureTime);
        if (Math.random() > 0.4 && origin.iataCode !== destination.iataCode) {
            const transit = TRANSIT_HUBS[Math.floor(Math.random() * TRANSIT_HUBS.length)];
            const leg1ArrivalTime = new Date(finalArrivalTime);
            leg1ArrivalTime.setUTCHours(leg1ArrivalTime.getUTCHours() + (Math.floor(Math.random() * 3) + 4));
            legs.push({ departure: { airport: origin, scheduledTime: finalArrivalTime }, arrival: { airport: transit, scheduledTime: leg1ArrivalTime }, durationMinutes: Math.round((leg1ArrivalTime - finalArrivalTime) / 60000), });
            finalArrivalTime = leg1ArrivalTime;
            const layoverMinutes = Math.floor(Math.random() * 90) + 60;
            finalArrivalTime.setUTCMinutes(finalArrivalTime.getUTCMinutes() + layoverMinutes);
            const leg2ArrivalTime = new Date(finalArrivalTime);
            leg2ArrivalTime.setUTCHours(leg2ArrivalTime.getUTCHours() + (Math.floor(Math.random() * 3) + 4));
            legs.push({ departure: { airport: transit, scheduledTime: finalArrivalTime }, arrival: { airport: destination, scheduledTime: leg2ArrivalTime }, durationMinutes: Math.round((leg2ArrivalTime - finalArrivalTime) / 60000), });
            finalArrivalTime = leg2ArrivalTime;
        } else {
            const arrivalTime = new Date(finalArrivalTime);
            arrivalTime.setUTCHours(arrivalTime.getUTCHours() + (Math.floor(Math.random() * 5) + 3));
            legs.push({ departure: { airport: origin, scheduledTime: finalArrivalTime }, arrival: { airport: destination, scheduledTime: arrivalTime }, durationMinutes: Math.round((arrivalTime - finalArrivalTime) / 60000), });
            finalArrivalTime = arrivalTime;
        }
        const totalDuration = Math.round((finalArrivalTime - departureTime) / 60000);
        flights.push({ id: `flight-${airline.code}${Math.floor(Math.random() * 9000) + 1000}`, number: `${airline.code} ${Math.floor(Math.random() * 900) + 100}`, airline: airline, totalDurationMinutes: totalDuration, legs: legs });
    }
    return flights;
};

const generateFlightSchedules = asyncHandler(async (req, res) => {
    const { origin, destination, startDate, endDate } = req.body;
    if (!origin || !destination || !startDate || !endDate) {
        return res.status(400).json({ error: 'Origin, destination, and a date range are required.' });
    }
    let allFlights = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);
    while (currentDate <= finalDate) {
        if (Math.random() > 0.2) {
            const dailyFlights = generateFlightsForDay(origin, destination, new Date(currentDate));
            allFlights = allFlights.concat(dailyFlights);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    allFlights.sort((a, b) => new Date(a.legs[0].departure.scheduledTime) - new Date(b.legs[0].departure.scheduledTime));
    res.json({ flights: allFlights });
});

export { generateFlightSchedules, searchLocations };
