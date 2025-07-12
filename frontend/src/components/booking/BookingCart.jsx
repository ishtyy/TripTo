import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Plane, ArrowRight } from 'lucide-react';

export default function BookingCart() {
  const { cart, proceedTo } = useBooking();

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">Your Itinerary</h2>
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
        {cart.map((flight, index) => {
          // ✅ FIX: Accessing the correct nested data structure for the flight legs.
          const firstLeg = flight.legs[0];
          const lastLeg = flight.legs[flight.legs.length - 1];

          return (
            <div key={`${flight.id}-${index}`} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className='flex items-center gap-4'>
                  <div className="p-3 bg-gray-700 rounded-lg"><Plane className="text-cyan-400" /></div>
                  <div>
                      <p className="font-semibold text-white">{flight.airline.name} ({flight.number})</p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                          {/* We use the airport data from the first and last legs */}
                          <span>{firstLeg.departure.airport.iataCode}</span>
                          <ArrowRight size={16}/>
                          <span>{lastLeg.arrival.airport.iataCode}</span>
                      </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => proceedTo('details')}
        className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
      >
        Enter Passenger Details
      </button>
    </div>
  );
}