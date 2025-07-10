import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Plane, ArrowRight } from 'lucide-react';

export default function ReviewBooking() {
  const { selectedFlight, passengers, proceedTo } = useBooking();
  const passenger = passengers[0];

  if (!selectedFlight || !passenger) {
    return <p className="text-red-400">Error: Missing flight or passenger details.</p>;
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">Review Your Booking</h2>
      <div className="space-y-6">
        {/* Flight Details */}
        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
          <h3 className="font-semibold text-lg text-cyan-400 mb-4">Flight Details</h3>
          <div className='flex items-center gap-4 mb-4'>
             <div className="p-3 bg-gray-700 rounded-lg"><Plane className="text-cyan-400" /></div>
             <div>
                <p className="font-bold text-lg text-white">{selectedFlight.airline.name} ({selectedFlight.number})</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{selectedFlight.departure.airport.iata}</span><ArrowRight size={16}/><span>{selectedFlight.arrival.airport.iata}</span>
                </div>
             </div>
          </div>
          <p className="text-sm text-gray-400">Date: {new Date(selectedFlight.departure.scheduledTime.local).toLocaleDateString()}</p>
        </div>

        {/* Passenger Details */}
        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
            <h3 className="font-semibold text-lg text-cyan-400 mb-4">Passenger</h3>
            <p className="text-white">{passenger.firstName} {passenger.lastName}</p>
            <p className="text-gray-400">{passenger.email}</p>
        </div>

        <button onClick={() => proceedTo('payment')} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
            Confirm & Proceed to Payment
        </button>
      </div>
    </div>
  );
}
