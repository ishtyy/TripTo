import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Plane, ArrowRight, User, Mail, Calendar, Hash, Clock } from 'lucide-react';

const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

export default function ReviewBooking() {
  const { cart, passengers, selectedSeats, proceedTo } = useBooking();

  if (cart.length === 0 || Object.keys(passengers).length < cart.length) {
    return <p className="text-red-400">Error: Missing details for one or more flights. Please restart the booking process.</p>;
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">Review Your Complete Booking</h2>
      <div className="space-y-6">
        
        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
          <h3 className="font-semibold text-lg text-cyan-400 mb-4">Your Itinerary</h3>
          <div className="space-y-6">
            {cart.map((flight) => (
              <div key={flight.id} className="pb-4 border-b border-gray-700 last:border-b-0">
                <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-white">{flight.airline.name} ({flight.number})</p>
                    <p className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Clock size={14}/> {formatDuration(flight.totalDurationMinutes)}</p>
                </div>
                
                <p className="text-sm text-gray-300">Passenger: <span className="font-semibold text-white">{passengers[flight.id]?.firstName} {passengers[flight.id]?.lastName}</span></p>
                <p className="text-sm text-gray-300">Seat: <span className="font-bold text-white">{selectedSeats[flight.id] || 'Not Selected'}</span></p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => proceedTo('payment')} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
            Confirm & Proceed to Payment
        </button>
      </div>
    </div>
  );
}
