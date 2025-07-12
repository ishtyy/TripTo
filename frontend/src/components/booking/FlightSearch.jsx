import React, { useState, useEffect } from 'react';
import { Plane, Search, Loader2, ArrowRight, Clock, PlusCircle } from 'lucide-react';
import api from '../../services/api';
import { useBooking } from '../../context/BookingContext';
import toast from 'react-hot-toast'; // We still need toast for the context to use it

const LocationInput = ({ label, value, onValueChange, suggestions, onSuggestionClick }) => {
    // This component remains the same.
    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            <input type="text" placeholder="City or Airport" value={value} onChange={(e) => onValueChange(e.target.value)} autoComplete="off" className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" />
            {suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 max-h-60 overflow-y-auto">
                    <ul>
                        {suggestions.map(suggestion => (
                            <li key={suggestion.id} onMouseDown={() => onSuggestionClick(suggestion)} className="p-3 hover:bg-cyan-600/20 cursor-pointer transition-colors">
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

// Helper function to format duration
const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

export default function FlightSearch() {
  const { addFlightToCart } = useBooking();

  const today = new Date();
  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(today.getDate() + 14);
  const formatDate = (date) => date.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(today));
  const [endDate, setEndDate] = useState(formatDate(twoWeeksFromNow));
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (origin.length < 3) { setOriginSuggestions([]); return; }
    const handler = setTimeout(() => { api.get(`/flights/search-locations?keyword=${origin}`).then(res => setOriginSuggestions(res.data.locations || [])).catch(() => setOriginSuggestions([])); }, 300);
    return () => clearTimeout(handler);
  }, [origin]);

  useEffect(() => {
    if (destination.length < 3) { setDestinationSuggestions([]); return; }
    const handler = setTimeout(() => { api.get(`/flights/search-locations?keyword=${destination}`).then(res => setDestinationSuggestions(res.data.locations || [])).catch(() => setDestinationSuggestions([])); }, 300);
    return () => clearTimeout(handler);
  }, [destination]);

  const handleSearchFlights = async () => {
    if (!selectedOrigin || !selectedDestination) { setError('Please select an origin and destination.'); return; }
    setLoading(true);
    setError('');
    setFlights([]);
    try {
        const res = await api.post(`/flights/generate-schedules`, { origin: selectedOrigin, destination: selectedDestination, startDate, endDate });
        if (!res.data.flights || res.data.flights.length === 0) {
            setError('No flights found for this route in the selected date range.');
        } else {
            setFlights(res.data.flights);
        }
    } catch (err) {
        setError(err.response?.data?.error || 'An error occurred.');
    } finally {
        setLoading(false);
    }
  };
  
  const groupedFlights = flights.reduce((groups, flight) => {
    const date = new Date(flight.legs[0].departure.scheduledTime).toISOString().split('T')[0];
    if (!groups[date]) { groups[date] = []; }
    groups[date].push(flight);
    return groups;
  }, {});
  
  // ✅ FIX: This function now ONLY calls the context function.
  // It no longer creates its own toast notification.
  const handleAddFlight = (flight) => {
      addFlightToCart(flight);
  };

  return (
    <div className='space-y-6'>
      {/* The Toaster component should be in your top-level App.jsx to be visible */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <LocationInput label="From (Origin)" value={origin} onValueChange={setOrigin} suggestions={originSuggestions} onSuggestionClick={(s) => { setSelectedOrigin(s); setOrigin(s.name); setOriginSuggestions([]); }} />
          <LocationInput label="To (Destination)" value={destination} onValueChange={setDestination} suggestions={destinationSuggestions} onSuggestionClick={(s) => { setSelectedDestination(s); setDestination(s.name); setDestinationSuggestions([]); }} />
          <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1.5">Start Date</label>
              <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
          </div>
          <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1.5">End Date</label>
              <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
          </div>
      </div>
      <button onClick={handleSearchFlights} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
          {loading ? 'Generating Flights...' : 'Find Flights'}
      </button>

      {error && <p className="text-center text-red-400">{error}</p>}

      {Object.keys(groupedFlights).length > 0 && (
          <div className="space-y-6 pt-6">
              {Object.entries(groupedFlights).map(([date, dailyFlights]) => (
                  <div key={date}>
                      <h3 className="text-xl font-semibold text-cyan-400 mb-3">{new Date(date + 'T00:00:00').toDateString()}</h3>
                      <div className="space-y-4">
                          {dailyFlights.map(flight => (
                              <div key={flight.id} className="bg-gray-900/80 p-4 rounded-xl border border-gray-800">
                                  <div className="flex justify-between items-center mb-4">
                                      <p className="font-bold text-white">{flight.airline.name} ({flight.number})</p>
                                      <p className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Clock size={14}/> {formatDuration(flight.totalDurationMinutes)}</p>
                                  </div>
                                  <div className="flex items-center">
                                      {flight.legs.map((leg, index) => (
                                          <React.Fragment key={index}>
                                              <div className="text-center">
                                                  <p className="text-xl font-bold">{leg.departure.airport.iataCode}</p>
                                                  <p className="text-xs text-gray-400">{new Date(leg.departure.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                              </div>
                                              <div className="flex-1 px-2">
                                                  <div className="w-full h-px bg-gray-700 relative">
                                                      <Plane size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-1 text-cyan-400"/>
                                                  </div>
                                                  {flight.legs.length > 1 && <p className="text-center text-xs mt-1 text-gray-500">{formatDuration(leg.durationMinutes)}</p>}
                                              </div>
                                              {index === flight.legs.length - 1 && (
                                                   <div className="text-center">
                                                        <p className="text-xl font-bold">{leg.arrival.airport.iataCode}</p>
                                                        <p className="text-xs text-gray-400">{new Date(leg.arrival.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                   </div>
                                              )}
                                          </React.Fragment>
                                      ))}
                                  </div>
                                   {flight.legs.length > 1 && (
                                      <div className="text-center mt-3 text-xs text-yellow-400 bg-yellow-900/50 py-1 rounded-md">
                                          Layover at {flight.legs[0].arrival.airport.iataCode}
                                      </div>
                                  )}
                                  <div className="text-right mt-4">
                                      <button onClick={() => handleAddFlight(flight)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-semibold flex items-center gap-2">
                                          <PlusCircle size={18} /> Add to Itinerary
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
