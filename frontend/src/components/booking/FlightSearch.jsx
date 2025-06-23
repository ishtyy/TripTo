import React, { useState, useEffect } from 'react';
import { Plane, Search, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const LocationInput = ({ label, value, onValueChange, suggestions, onSuggestionClick }) => (
    <div className="relative w-full">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        <input type="text" placeholder="City or Airport" value={value} onChange={(e) => onValueChange(e.target.value)} autoComplete="off" className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" />
        {suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 max-h-60 overflow-y-auto">
                <ul>
                    {suggestions.map(suggestion => (
                        <li key={suggestion.id} onClick={() => onSuggestionClick(suggestion)} className="p-3 hover:bg-cyan-600/20 cursor-pointer transition-colors">
                            <p className="font-semibold text-white">{suggestion.name} ({suggestion.iataCode})</p>
                            <p className="text-sm text-gray-400">{suggestion.address.cityName}, {suggestion.address.countryName}</p>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

export default function FlightSearch() {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [selectedOrigin, setSelectedOrigin] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [flightOffers, setFlightOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (origin.length < 2 || (selectedOrigin && origin === `${selectedOrigin.name} (${selectedOrigin.iataCode})`)) { setOriginSuggestions([]); return; }
        const handler = setTimeout(() => { api.get(`/flights/search-locations?keyword=${origin}`).then(res => setOriginSuggestions(res.data.locations || [])).catch(() => setOriginSuggestions([])); }, 300);
        return () => clearTimeout(handler);
    }, [origin, selectedOrigin]);

    useEffect(() => {
        if (destination.length < 2 || (selectedDestination && destination === `${selectedDestination.name} (${selectedDestination.iataCode})`)) { setDestinationSuggestions([]); return; }
        const handler = setTimeout(() => { api.get(`/flights/search-locations?keyword=${destination}`).then(res => setDestinationSuggestions(res.data.locations || [])).catch(() => setDestinationSuggestions([])); }, 300);
        return () => clearTimeout(handler);
    }, [destination, selectedDestination]);

    const handleSearchFlights = async () => {
        if (!selectedOrigin || !selectedDestination || !departureDate) { setError('Please select an origin, destination, and departure date.'); return; }
        setLoading(true); setError(''); setFlightOffers([]);
        try {
            const res = await api.get(`/flights/offers?origin=${selectedOrigin.iataCode}&destination=${selectedDestination.iataCode}&date=${departureDate}`);
            setFlightOffers(res.data.offers || []);
        } catch (err) { setError('Failed to find flight offers. Please try again.'); } finally { setLoading(false); }
    };

    return (
        <div className='space-y-6'>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <LocationInput label="From (Origin)" value={origin} onValueChange={(val) => { setOrigin(val); setSelectedOrigin(null); }} suggestions={originSuggestions} onSuggestionClick={(s) => { setSelectedOrigin(s); setOrigin(`${s.name} (${s.iataCode})`); setOriginSuggestions([]); }} />
                <LocationInput label="To (Destination)" value={destination} onValueChange={(val) => { setDestination(val); setSelectedDestination(null); }} suggestions={destinationSuggestions} onSuggestionClick={(s) => { setSelectedDestination(s); setDestination(`${s.name} (${s.iataCode})`); setDestinationSuggestions([]); }} />
                <div>
                    <label htmlFor="departureDate" className="block text-sm font-medium text-gray-300 mb-1.5">Departure Date</label>
                    <input id="departureDate" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
            </div>
            <button onClick={handleSearchFlights} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                <span>{loading ? 'Searching...' : 'Find Flights'}</span>
            </button>
            {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</p>}
            {flightOffers.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-gray-800">
                    <h2 className="text-2xl font-bold text-white">Search Results</h2>
                    {flightOffers.map(offer => (
                        <div key={offer.id} className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className='flex items-center gap-4'>
                                <div className="p-3 bg-gray-800 rounded-lg"><Plane className="text-cyan-400" /></div>
                                <div>
                                    <p className="font-bold text-lg text-white">{offer.itineraries[0].segments.map(s => s.carrierCode + ' ' + s.aircraft.code).join(', ')}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-400"><span>{selectedOrigin.iataCode}</span><ArrowRight size={16}/><span>{selectedDestination.iataCode}</span></div>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-2xl font-bold text-purple-400">€{offer.price.total}</p>
                                <button className="mt-1 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-semibold transition-colors">Book Now</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}