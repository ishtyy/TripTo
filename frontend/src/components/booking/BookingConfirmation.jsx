import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { CheckCircle } from 'lucide-react';

export default function BookingConfirmation() {
  const { bookingDetails, closeBookingModal } = useBooking();

  if (!bookingDetails) {
    return null; // Should not happen in the normal flow
  }

  return (
    <div className="text-center animate-fade-in-up">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-400 mb-6">Your flight ticket has been issued.</p>

        <div className="text-left bg-gray-800/50 p-5 rounded-xl border border-gray-700 max-w-lg mx-auto">
            <h3 className="font-semibold text-lg text-cyan-400 mb-4">Booking Summary</h3>
            <div className="space-y-2">
                <p><strong className="text-gray-400">Reference:</strong> <span className="text-white font-mono">{bookingDetails.reference}</span></p>
                <p><strong className="text-gray-400">Flight:</strong> <span className="text-white">{bookingDetails.flight.airline.name} {bookingDetails.flight.number}</span></p>
                <p><strong className="text-gray-400">Passenger:</strong> <span className="text-white">{bookingDetails.passengers[0].firstName} {bookingDetails.passengers[0].lastName}</span></p>
            </div>
        </div>

        <button onClick={closeBookingModal} className="mt-8 w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
            Close
        </button>
    </div>
  );
}
