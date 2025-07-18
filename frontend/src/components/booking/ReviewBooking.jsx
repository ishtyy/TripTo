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

    // Check if all flights have passenger and seat info
    const allDetailsProvided = cart.every(flight => passengers[flight.id] && selectedSeats[flight.id]);

    if (!allDetailsProvided) {
        return <p className="text-red-400">Error: Missing passenger or seat details for one or more flights. Please go back and complete all details.</p>;
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

                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <p className="text-gray-400 flex items-center gap-2"><User size={14}/> Passenger</p>
                                        <p className="font-semibold text-white">{passengers[flight.id]?.firstName} {passengers[flight.id]?.lastName}</p>
                                        <p className="text-gray-400 text-xs">{passengers[flight.id]?.gender}, {passengers[flight.id]?.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 flex items-center justify-end gap-2"><Hash size={14}/> Seat</p>
                                        <p className="font-semibold text-white">{selectedSeats[flight.id] || 'Not Selected'}</p>
                                    </div>
                                </div>

                                {flight.legs.map((leg, index) => (
                                    <div key={index} className="flex items-center text-sm">
                                        <div className="w-1/3">
                                            <p className="font-bold">{leg.departure.airport.iataCode}</p>
                                            <p className="text-xs text-gray-400">{new Date(leg.departure.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                        <div className="w-1/3 text-center text-gray-500"><ArrowRight /></div>
                                        <div className="w-1/3 text-right">
                                            <p className="font-bold">{leg.arrival.airport.iataCode}</p>
                                            <p className="text-xs text-gray-400">{new Date(leg.arrival.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                ))}

                                {flight.legs.length > 1 && (
                                    <div className="text-center mt-3 text-xs text-yellow-400 bg-yellow-900/50 py-1 rounded-md">
                                        Layover at {flight.legs[0].arrival.airport.iataCode}
                                    </div>
                                )}
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