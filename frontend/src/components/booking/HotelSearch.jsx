import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, Star, DollarSign, Wifi, Car, Coffee, Utensils, Zap, Building2 } from 'lucide-react';
import { hotelAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function HotelSearch() {
  const [searchParams, setSearchParams] = useState({
    destination: '',
    checkin: '',
    checkout: '',
    guests: 2
  });
  const [hotels, setHotels] = useState([]);
  const [popularHotels, setPopularHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    loadPopularHotels();
  }, []);

  const loadPopularHotels = async () => {
    try {
      const response = await hotelAPI.getPopularHotels();
      setPopularHotels(response.data.hotels || []);
    } catch (error) {
      console.error('Error loading popular hotels:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchParams.destination || !searchParams.checkin || !searchParams.checkout) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await hotelAPI.searchHotels(searchParams);
      setHotels(response.data.hotels || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching hotels:', error);
      toast.error(error.response?.data?.message || 'Error searching hotels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (hotel) => {
    setSelectedHotel(hotel);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    try {
      const bookingData = {
        hotel_id: selectedHotel.id,
        checkin_date: searchParams.checkin,
        checkout_date: searchParams.checkout,
        guests: searchParams.guests,
        total_amount: selectedHotel.price_per_night * getDaysDifference()
      };

      await hotelAPI.bookHotel(bookingData);
      toast.success('Hotel booked successfully! 🏨');
      setShowBookingModal(false);
      setSelectedHotel(null);
    } catch (error) {
      console.error('Error booking hotel:', error);
      toast.error(error.response?.data?.message || 'Error booking hotel. Please try again.');
    }
  };

  const getDaysDifference = () => {
    if (!searchParams.checkin || !searchParams.checkout) return 1;
    const checkin = new Date(searchParams.checkin);
    const checkout = new Date(searchParams.checkout);
    const timeDiff = checkout.getTime() - checkin.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const amenityIcons = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
    restaurant: Utensils,
    spa: Zap,
    gym: Building2
  };

  return (
    <div className='space-y-6'>
      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Destination</label>
          <input 
            type="text" 
            placeholder="e.g., Paris, France" 
            value={searchParams.destination}
            onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Check-in</label>
          <input 
            type="date" 
            value={searchParams.checkin}
            onChange={(e) => setSearchParams({...searchParams, checkin: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors dark-calendar-picker" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Check-out</label>
          <input 
            type="date" 
            value={searchParams.checkout}
            onChange={(e) => setSearchParams({...searchParams, checkout: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors dark-calendar-picker" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Guests</label>
          <select 
            value={searchParams.guests}
            onChange={(e) => setSearchParams({...searchParams, guests: parseInt(e.target.value)})}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            {[1,2,3,4,5,6].map(num => (
              <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        onClick={handleSearch} 
        disabled={loading}
        className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
      >
        <Search />
        <span>{loading ? 'Searching...' : 'Search Hotels'}</span>
      </button>

      {/* Popular Hotels (shown when no search results) */}
      {!showResults && popularHotels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Star className="text-yellow-400" />
            Popular Hotels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} onBook={() => handleBooking(hotel)} />
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {hotels.length} Hotels Found in {searchParams.destination}
            </h3>
            <button 
              onClick={() => setShowResults(false)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Show Popular Hotels
            </button>
          </div>
          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} onBook={() => handleBooking(hotel)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hotels found for your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Booking</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between">
                <span>Hotel:</span>
                <span className="text-white">{selectedHotel.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in:</span>
                <span>{searchParams.checkin}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out:</span>
                <span>{searchParams.checkout}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests:</span>
                <span>{searchParams.guests}</span>
              </div>
              <div className="flex justify-between">
                <span>Nights:</span>
                <span>{getDaysDifference()}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white border-t border-gray-700 pt-3">
                <span>Total:</span>
                <span>${(selectedHotel.price_per_night * getDaysDifference()).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBooking}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hotel Card Component
function HotelCard({ hotel, onBook }) {
  const amenityIcons = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
    restaurant: Utensils,
    spa: Zap,
    gym: Building2
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-cyan-900/20 flex items-center justify-center">
        <Building2 size={48} className="text-gray-600" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-white">{hotel.name}</h4>
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-sm text-gray-300">{hotel.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <MapPin size={14} />
          <span>{hotel.location}</span>
        </div>

        {hotel.amenities && (
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 4).map((amenity) => {
              const IconComponent = amenityIcons[amenity] || Building2;
              return (
                <div key={amenity} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                  <IconComponent size={12} />
                  <span className="capitalize">{amenity}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="text-white">
            <span className="text-lg font-semibold">${hotel.price_per_night}</span>
            <span className="text-sm text-gray-400">/night</span>
          </div>
          <button 
            onClick={onBook}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}