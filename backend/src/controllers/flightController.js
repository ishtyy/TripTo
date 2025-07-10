import asyncHandler from 'express-async-handler';
import axios from 'axios';

// --- This part for airport location search remains the same ---
const AERO_API_KEY = process.env.AERODATABOX_API_KEY;
const AERO_API_HOST = process.env.AERODATABOX_API_HOST;

const aeroApi = axios.create({
  baseURL: `https://aerodatabox.p.rapidapi.com`,
  headers: {
    'X-RapidAPI-Key': AERO_API_KEY,
    'X-RapidAPI-Host': AERO_API_HOST,
  },
});

const searchLocations = asyncHandler(async (req, res) => {
    // This function remains unchanged and still uses the real API
    const { keyword } = req.query;
    if (!keyword || keyword.length < 3) return res.json({ locations: [] });
    try {
        const response = await aeroApi.get(`/airports/search/term`, { params: { q: keyword, limit: 10 } });
        if (!response.data.items) return res.json({ locations: [] });
        const mappedLocations = response.data.items.map(item => ({
            id: item.iata, name: item.name, iataCode: item.iata,
            address: { cityName: item.municipalityName || 'N/A', countryName: item.country?.name || item.countryCode || 'Unknown' },
        }));
        res.json({ locations: mappedLocations });
    } catch (error) {
        console.error("AeroDataBox API Error (Locations):", error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch locations.' });
    }
});
// -----------------------------------------------------------


// ✅ --- NEW: Our Realistic Dummy Data Generator ---

const DUMMY_AIRLINES = [
    { name: 'TripTo Airways', code: 'TA' },
    { name: 'Tempo Flights', code: 'TP' },
    { name: 'Quantum Jets', code: 'QJ' },
    { name: 'SkyLink Express', code: 'SE' },
];

const DUMMY_AIRCRAFT = ["Boeing 737", "Airbus A320", "Boeing 787 Dreamliner", "Airbus A350"];

// This function creates a set of random flights for a single day
const generateFlightsForDay = (origin, destination, date) => {
    const flights = [];
    const numFlights = Math.floor(Math.random() * 5) + 2; // Generate 2 to 6 flights per day

    for (let i = 0; i < numFlights; i++) {
        const airline = DUMMY_AIRLINES[Math.floor(Math.random() * DUMMY_AIRLINES.length)];
        const departureHour = Math.floor(Math.random() * 16) + 6; // Departures between 6 AM and 10 PM
        const departureMinutes = Math.floor(Math.random() * 60);
        const flightDurationHours = Math.floor(Math.random() * 4) + 2; // 2-5 hour flights
        const flightDurationMinutes = Math.floor(Math.random() * 60);

        const departureTime = new Date(date);
        departureTime.setUTCHours(departureHour, departureMinutes, 0, 0);

        const arrivalTime = new Date(departureTime);
        arrivalTime.setUTCHours(arrivalTime.getUTCHours() + flightDurationHours);
        arrivalTime.setUTCMinutes(arrivalTime.getUTCMinutes() + flightDurationMinutes);

        flights.push({
            number: `${airline.code}${Math.floor(Math.random() * 900) + 100}`,
            airline: { name: airline.name },
            aircraft: { model: DUMMY_AIRCRAFT[Math.floor(Math.random() * DUMMY_AIRCRAFT.length)] },
            departure: {
                airport: { iata: origin.iataCode, name: origin.name },
                scheduledTime: { local: departureTime.toISOString() },
                terminal: `${Math.floor(Math.random() * 4) + 1}`,
            },
            arrival: {
                airport: { iata: destination.iataCode, name: destination.name },
                scheduledTime: { local: arrivalTime.toISOString() },
                terminal: `B${Math.floor(Math.random() * 5) + 1}`,
            },
            status: "Scheduled",
        });
    }
    return flights;
};


/**
 * @desc    Generate a schedule of flights over a date range
 * @route   POST /api/flights/generate-schedules
 * @access  Public
 */
const generateFlightSchedules = asyncHandler(async (req, res) => {
    const { origin, destination, startDate, endDate } = req.body;

    if (!origin || !destination || !startDate || !endDate) {
        return res.status(400).json({ error: 'Origin, destination, and a date range are required.' });
    }

    let allFlights = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
        // Only generate flights for about 80% of the days to make it more realistic
        if (Math.random() > 0.2) {
            const dailyFlights = generateFlightsForDay(origin, destination, new Date(currentDate));
            allFlights = allFlights.concat(dailyFlights);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort all flights by departure time
    allFlights.sort((a, b) => new Date(a.departure.scheduledTime.local) - new Date(b.departure.scheduledTime.local));

    res.json({ flights: allFlights });
});


// Export the new generator function and the existing location search
export { generateFlightSchedules, searchLocations };