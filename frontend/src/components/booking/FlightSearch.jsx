import React, { useState, useEffect } from 'react';
import { Plane, Search, Loader2, ArrowRight, Clock } from 'lucide-react';
import api from '../../services/api';
import { useBooking } from '../../context/BookingContext'; // Import the hook to use our booking context

// This is a reusable sub-component for the location input fields.
const LocationInput = ({ label, value, onValueChange, suggestions, onSuggestionClick }) => {
    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            <input
                type="text"
                placeholder="City or Airport"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 max-h-60 overflow-y-auto">
                    <ul>
                        {suggestions.map(suggestion => (
                            <li
                                key={suggestion.id}
                                onMouseDown={() => onSuggestionClick(suggestion)}
                                className="p-3 hover:bg-cyan-600/20 cursor-pointer transition-colors"
                            >
                                <p className="font-semibold text-white">{suggestion.name} ({suggestion.iataCode})</p>
                                <p className="text-sm text-gray-400">{suggestion.address.cityName}, {suggestion.address.countryName}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// This is the main component that orchestrates the entire flight search process.
export default function FlightSearch() {
    // Get the startBooking function from our context to start the booking process
    const { startBooking } = useBooking();

    // State for user inputs
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 2);
        return date.toISOString().split('T')[0];
    });

    // State for autocomplete suggestions
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    // State to hold the final selected locations
    const [selectedOrigin, setSelectedOrigin] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);

    // State for the results and UI feedback
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // useEffect hook to fetch autocomplete suggestions for the ORIGIN input
    useEffect(() => {
        if (origin.length < 3) {
            setOriginSuggestions([]);
            return;
        }
        const handler = setTimeout(() => {
            api.get(`/flights/search-locations?keyword=${origin}`)
                .then(res => setOriginSuggestions(res.data.locations || []))
                .catch(() => setOriginSuggestions([]));
        }, 300);
        return () => clearTimeout(handler);
    }, [origin]);

    // useEffect hook to fetch autocomplete suggestions for the DESTINATION input
    useEffect(() => {
        if (destination.length < 3) {
            setDestinationSuggestions([]);
            return;
        }
        const handler = setTimeout(() => {
            api.get(`/flights/search-locations?keyword=${destination}`)
                .then(res => setDestinationSuggestions(res.data.locations || []))
                .catch(() => setDestinationSuggestions([]));
        }, 300);
        return () => clearTimeout(handler);
    }, [destination]);

    // This is the main function to handle the flight search when the button is clicked
    const handleSearchFlights = async () => {
        if (!selectedOrigin || !selectedDestination || !startDate || !endDate) {
            setError('Please select an origin, destination, and a valid date range.');
            return;
        }
        setLoading(true);
        setError('');
        setFlights([]);
        try {
            const searchPayload = {
                origin: selectedOrigin,
                destination: selectedDestination,
                startDate,
                endDate,
            };
            const res = await api.post(`/flights/generate-schedules`, searchPayload);

            if (!res.data.flights || res.data.flights.length === 0) {
                setError('No flights were generated for this route in the selected date range.');
            } else {
                setFlights(res.data.flights);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Helper to group flights by date for display
    const groupedFlights = flights.reduce((groups, flight) => {
        const date = new Date(flight.departure.scheduledTime.local).toISOString().split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(flight);
        return groups;
    }, {});

    return (
        <div className='space-y-6'>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <LocationInput
                    label="From (Origin)"
                    value={origin}
                    onValueChange={setOrigin}
                    suggestions={originSuggestions}
                    onSuggestionClick={(s) => { setSelectedOrigin(s); setOrigin(`${s.name} (${s.iataCode})`); setOriginSuggestions([]); }}
                />
                <LocationInput
                    label="To (Destination)"
                    value={destination}
                    onValueChange={setDestination}
                    suggestions={destinationSuggestions}
                    onSuggestionClick={(s) => { setSelectedDestination(s); setDestination(`${s.name} (${s.iataCode})`); setDestinationSuggestions([]); }}
                />
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1.5">Start Date</label>
                    <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1.5">End Date</label>
                    <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500" />
                </div>
            </div>

            <button
                onClick={handleSearchFlights}
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                <span>{loading ? 'Generating Flights...' : 'Find Flights'}</span>
            </button>

            {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</p>}

            {Object.keys(groupedFlights).length > 0 && (
                <div className="space-y-6 pt-6 border-t border-gray-800">
                    {Object.entries(groupedFlights).map(([date, dailyFlights]) => (
                        <div key={date}>
                            <h3 className="text-xl font-semibold text-cyan-400 mb-3">
                                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="space-y-4">
                                {dailyFlights.map(flight => (
                                    <div key={flight.number} className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className='flex items-center gap-4 flex-grow'>
                                            <div className="p-3 bg-gray-800 rounded-lg"><Plane className="text-cyan-400" /></div>
                                            <div>
                                                <p className="font-bold text-lg text-white">{flight.airline.name} ({flight.number})</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <span>{flight.departure.airport.iata}</span>
                                                    <ArrowRight size={16}/>
                                                    <span>{flight.arrival.airport.iata}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-semibold text-white">
                                                {new Date(flight.departure.scheduledTime.local).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {' - '}
                                                {new Date(flight.arrival.scheduledTime.local).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            <p className="text-sm text-gray-400">Terminal: {flight.departure.terminal}</p>
                                        </div>
                                        <div className="text-right">
                                            <button 
                                                onClick={() => startBooking(flight)} 
                                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-semibold transition-colors">
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
