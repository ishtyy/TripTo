// tempo/frontend/src/pages/BookTripPage.jsx
import React, { useState, useCallback } from "react";
import api from '../services/api';
import MapDisplay from "../components/MapDisplay.jsx";
import AirportAutocomplete from "../components/AirportAutocomplete.jsx";
import { Bed, Plane, Calendar, Search, Loader2 } from "lucide-react";

// FlightOfferCard and formatPrice helpers
const formatPrice = (price) => {
    if (!price || !price.currency || !price.total) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency }).format(price.total);
};
const FlightOfferCard = ({ offer, dictionaries }) => {
    if (!offer.itineraries?.[0]?.segments?.[0]) return null;
    const carrierCode = offer.itineraries[0].segments[0].carrierCode;
    const airlineName = dictionaries.carriers?.[carrierCode] || carrierCode;
    const duration = offer.itineraries[0].duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || 'N/A';
    const stops = offer.itineraries[0].segments.length - 1;

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-sky-500 transition-colors">
            <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-lg text-sky-400">{airlineName}</p>
                <p className="text-sm text-gray-300">Duration: {duration}</p>
                <p className="text-sm text-gray-400">{stops > 0 ? `${stops} stop(s)` : 'Direct'}</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-white">{formatPrice(offer.price)}</p>
                <button className="mt-2 px-4 py-2 bg-sunset hover:bg-orange-600 text-white font-semibold rounded-md transition-colors">
                    Select
                </button>
            </div>
        </div>
    );
};

export default function BookTripPage() {
  const [selectedTab, setSelectedTab] = useState("flights");
  
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureDate, setDepartureDate] = useState('');
  
  const [activeInput, setActiveInput] = useState('origin');
  
  const [flightOffers, setFlightOffers] = useState([]);
  const [dictionaries, setDictionaries] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMapClick = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    try {
        const response = await api.get(`/flights/search-by-coords?lat=${lat}&lng=${lng}`);
        const locations = response.data.locations;

        if (locations && locations.length > 0) {
            const nearestAirport = locations[0];
            
            if (activeInput === 'origin') {
                setOrigin(nearestAirport);
            } else {
                setDestination(nearestAirport);
            }
        } else {
            alert("No airports found near the clicked location.");
        }
    } catch (err) {
        alert("Could not find an airport near this location.");
    }
  }, [activeInput]);

  const handleFlightSearch = async () => {
    if (!origin || !destination || !departureDate) {
      setError('Please select a valid origin, destination, and departure date.');
      return;
    }
    setError('');
    setIsLoading(true);
    setFlightOffers([]);
    setDictionaries({});
    try {
      const response = await api.get('/flights/offers', {
        params: {
          origin: origin.iataCode,
          destination: destination.iataCode,
          date: departureDate,
        }
      });
      setFlightOffers(response.data.offers || []);
      setDictionaries(response.data.dictionaries || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find flights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFlightSearch = () => (
    <div className="md:col-span-2 space-y-4">
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
            <p className="text-sm text-center text-gray-400">
                Type to search, or hover over a field and click the map.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AirportAutocomplete 
                    label="From" 
                    onLocationSelect={setOrigin}
                    selectedLocation={origin}
                    onMouseEnter={() => setActiveInput('origin')}
                    isActive={activeInput === 'origin'}
                    onClear={() => setOrigin(null)}
                />
                <AirportAutocomplete 
                    label="To" 
                    onLocationSelect={setDestination}
                    selectedLocation={destination}
                    onMouseEnter={() => setActiveInput('destination')}
                    isActive={activeInput === 'destination'}
                    onClear={() => setDestination(null)}
                />
            </div>
             <div className="relative">
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-200 mb-1">Depart</label>
                <Calendar className="absolute left-3 top-10 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    id="departure-date"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean border border-gray-700"
                    min={new Date().toISOString().split("T")[0]}
                />
            </div>
            <button 
                onClick={handleFlightSearch}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-ocean hover:bg-ocean/90 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                {isLoading ? 'Searching...' : 'Search Flights'}
            </button>
        </div>
        <div className="space-y-4">
            {error && <p className="text-center text-red-400 p-3 bg-red-900/30 rounded-md">{error}</p>}
            {isLoading && (
                 <div className="text-center text-gray-300 py-6">
                    <Loader2 size={32} className="animate-spin inline-block mb-3" />
                    <p>Finding the best flights...</p>
                </div>
            )}
            {!isLoading && flightOffers.length > 0 && flightOffers.map(offer => (
                <FlightOfferCard key={offer.id} offer={offer} dictionaries={dictionaries} />
            ))}
        </div>
    </div>
  );

  const renderPlaceholder = (tabName) => (
      <div className="md:col-span-2 space-y-4 text-center p-8 bg-gray-800 rounded-lg">
          <p className="text-gray-400">{tabName} search functionality is not yet implemented.</p>
      </div>
  );

  return (
    <div className="space-y-8 px-4">
      <div className="w-full h-80 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
        <MapDisplay 
            origin={origin} 
            destination={destination}
            onMapClick={handleMapClick}
        />
      </div>
      <div>
        <div className="flex space-x-4 border-b border-gray-700">
          <button onClick={() => setSelectedTab("flights")} className={`py-2 px-4 flex items-center gap-2 text-base transition-colors ${selectedTab === "flights" ? "border-b-2 border-ocean text-ocean font-semibold" : "text-gray-400 hover:text-gray-200"}`}>
            <Plane size={20} /> Flights
          </button>
          <button onClick={() => setSelectedTab("hotels")} className={`py-2 px-4 flex items-center gap-2 text-base transition-colors ${selectedTab === "hotels" ? "border-b-2 border-ocean text-ocean font-semibold" : "text-gray-400 hover:text-gray-200"}`}>
            <Bed size={20} /> Hotels
          </button>
          <button onClick={() => setSelectedTab("packages")} className={`py-2 px-4 flex items-center gap-2 text-base transition-colors ${selectedTab === "packages" ? "border-b-2 border-ocean text-ocean font-semibold" : "text-gray-400 hover:text-gray-200"}`}>
            <Plane size={20} /> Packages
          </button>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {selectedTab === 'flights' && renderFlightSearch()}
          {selectedTab === 'hotels' && renderPlaceholder('Hotels')}
          {selectedTab === 'packages' && renderPlaceholder('Packages')}
          
          <div className="bg-gray-800 rounded-lg p-4 space-y-3 md:col-span-1">
            <h3 className="text-xl font-heading text-sky-400">
              {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Details
            </h3>
            <p className="text-gray-300">
              Select an item on the left to view more information here.
            </p>
            <div className="bg-gray-700 h-40 flex items-center justify-center text-gray-400 rounded">
              Details will appear here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}