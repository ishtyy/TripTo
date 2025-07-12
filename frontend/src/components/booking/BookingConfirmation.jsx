import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { CheckCircle, Plane, ArrowRight, User, Hash } from 'lucide-react';

const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

export default function BookingConfirmation() {
  const { bookingDetails, closeBookingModal } = useBooking();

  if (!bookingDetails) return null;
  
  const { flights, passengers, seats, booking_id, booked_at } = bookingDetails;
  
  return (
    <div className="animate-fade-in-up">
        <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-gray-400 mb-6">Your itinerary is confirmed. A copy has been sent to the primary passenger's email.</p>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                <div>
                    <p className="text-sm text-gray-400">Booking ID</p>
                    <p className="text-lg text-white font-mono font-bold">{booking_id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Date Booked</p>
                    <p className="text-lg text-white font-bold">{new Date(booked_at).toLocaleDateString()}</p>
                </div>
            </div>

            {flights.map((flight) => {
                const passenger = passengers[flight.id] || {};
                const seat = seats[flight.id] || 'N/A';
                
                return (
                    <div key={flight.id} className="pb-4 border-b border-gray-700 last:border-b-0">
                        <p className="font-semibold text-lg text-cyan-400 mb-3">{flight.airline.name} - Flight {flight.number}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <p className="text-gray-400 flex items-center gap-2"><User size={14}/> Passenger</p>
                                <p className="font-semibold text-white">{passenger.firstName} {passenger.lastName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 flex items-center justify-end gap-2"><Hash size={14}/> Seat</p>
                                <p className="font-semibold text-white">{seat}</p>
                            </div>
                        </div>

                        {flight.legs.map((leg, index) => (
                             <div key={index} className="flex items-center text-sm">
                                <div className="w-1/3">
                                    <p className="font-bold">{leg.departure.airport.iataCode}</p>
                                    <p>{new Date(leg.departure.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                <div className="w-1/3 text-center text-gray-500"><ArrowRight /></div>
                                <div className="w-1/3 text-right">
                                    <p className="font-bold">{leg.arrival.airport.iataCode}</p>
                                    <p>{new Date(leg.arrival.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                             </div>
                        ))}
                    </div>
                )
            })}
        </div>

        <button onClick={closeBookingModal} className="mt-8 w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
            Done
        </button>
    </div>
  );
}
