import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Plane, ArrowRight, Trash2 } from 'lucide-react'; // Import Trash2

export default function BookingCart() {
    const { cart, proceedTo, removeFlightFromCart } = useBooking(); // Use removeFlightFromCart

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Your Itinerary</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {cart.length === 0 ? (
                    <p className="text-gray-400 text-center">Your itinerary is empty. Please add flights from the search results.</p>
                ) : (
                    cart.map((flight, index) => {
                        const firstLeg = flight.legs[0];
                        const lastLeg = flight.legs[flight.legs.length - 1];

                        return (
                            <div key={`${flight.id}-${index}`} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                                <div className='flex items-center gap-4'>
                                    <div className="p-3 bg-gray-700 rounded-lg"><Plane className="text-cyan-400" /></div>
                                    <div>
                                        <p className="font-semibold text-white">{flight.airline.name} ({flight.number})</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>{firstLeg.departure.airport.iataCode}</span>
                                            <ArrowRight size={16}/>
                                            <span>{lastLeg.arrival.airport.iataCode}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFlightFromCart(flight.id)}
                                    className="text-red-400 hover:text-red-500 transition-colors p-2 rounded-full"
                                    title="Remove from itinerary"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
            {cart.length > 0 && (
                <button
                    onClick={() => proceedTo('details')}
                    className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                    Enter Passenger Details
                </button>
            )}
        </div>
    );
}