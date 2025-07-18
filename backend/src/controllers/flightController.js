import asyncHandler from 'express-async-handler';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto'; // Import crypto for UUID generation

// This is the only function that needs to change.
const searchLocations = asyncHandler(async (req, res) => {
    const { keyword } = req.query;
    if (!keyword || keyword.length < 1) {
        return res.json({ locations: [] });
    }

    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const airportsPath = path.join(__dirname, '..', 'data', 'airports.json');
        
        const data = await fs.readFile(airportsPath, 'utf8');
        const airports = JSON.parse(data);

        const searchLower = keyword.toLowerCase();
        
        const uniqueIataCodes = new Set();
        const filteredAndDeduplicatedResults = [];

        for (const airport of airports) {
            const matches = 
                airport.name.toLowerCase().includes(searchLower) ||
                airport.city.toLowerCase().includes(searchLower) ||
                airport.iata.toLowerCase().includes(searchLower);

            if (matches && !uniqueIataCodes.has(airport.iata)) {
                filteredAndDeduplicatedResults.push(airport);
                uniqueIataCodes.add(airport.iata);
            }
            if (filteredAndDeduplicatedResults.length >= 10) {
                break;
            }
        }

        const mappedLocations = filteredAndDeduplicatedResults.map(item => ({
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

        const dummySeat = Math.floor(Math.random() * 30) + 1 + (Math.random() > 0.5 ? 'A' : 'B');
        const dummyGate = 'G' + (Math.floor(Math.random() * 10) + 1);
        const dummyTerminal = 'T' + (Math.floor(Math.random() * 3) + 1);
        const dummyClass = Math.random() > 0.7 ? 'Business' : 'Economy';


        if (Math.random() > 0.4 && origin.iataCode !== destination.iataCode) {
            const transit = TRANSIT_HUBS[Math.floor(Math.random() * TRANSIT_HUBS.length)];
            const leg1ArrivalTime = new Date(finalArrivalTime);
            leg1ArrivalTime.setUTCHours(leg1ArrivalTime.getUTCHours() + (Math.floor(Math.random() * 3) + 4));
            legs.push({
                departure: { airport: origin, scheduledTime: finalArrivalTime },
                arrival: { airport: transit, scheduledTime: leg1ArrivalTime },
                durationMinutes: Math.round((leg1ArrivalTime - finalArrivalTime) / 60000),
                seat_number: dummySeat, gate: dummyGate, terminal: dummyTerminal, flight_class: dummyClass
            });
            finalArrivalTime = leg1ArrivalTime;
            const layoverMinutes = Math.floor(Math.random() * 90) + 60;
            finalArrivalTime.setUTCMinutes(finalArrivalTime.getUTCMinutes() + layoverMinutes);
            const leg2ArrivalTime = new Date(finalArrivalTime);
            leg2ArrivalTime.setUTCHours(leg2ArrivalTime.getUTCHours() + (Math.floor(Math.random() * 3) + 4));
            legs.push({
                departure: { airport: transit, scheduledTime: finalArrivalTime },
                arrival: { airport: destination, scheduledTime: leg2ArrivalTime },
                durationMinutes: Math.round((leg2ArrivalTime - finalArrivalTime) / 60000),
                seat_number: dummySeat, gate: dummyGate, terminal: dummyTerminal, flight_class: dummyClass
            });
            finalArrivalTime = leg2ArrivalTime;
        } else {
            const arrivalTime = new Date(finalArrivalTime);
            arrivalTime.setUTCHours(arrivalTime.getUTCHours() + (Math.floor(Math.random() * 5) + 3));
            legs.push({
                departure: { airport: origin, scheduledTime: finalArrivalTime },
                arrival: { airport: destination, scheduledTime: arrivalTime },
                durationMinutes: Math.round((arrivalTime - finalArrivalTime) / 60000),
                seat_number: dummySeat, gate: dummyGate, terminal: dummyTerminal, flight_class: dummyClass
            });
            finalArrivalTime = arrivalTime;
        }
        const totalDuration = Math.round((finalArrivalTime - departureTime) / 60000);
        flights.push({
            id: crypto.randomUUID(), // FIX: Generate a UUID for flight.id
            number: `${airline.code} ${Math.floor(Math.random() * 900) + 100}`,
            airline: airline,
            totalDurationMinutes: totalDuration,
            legs: legs,
            seat_number: legs[0].seat_number,
            gate: legs[0].gate,
            terminal: legs[0].terminal,
            flight_class: legs[0].flight_class
        });
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