import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBooking } from '../../context/BookingContext';
import { Armchair, Plane, ArrowRight } from 'lucide-react';

const Seat = ({ number, isOccupied, isSelected, onSelect }) => {
    let seatClass = "p-2 rounded-t-lg cursor-pointer transition-colors ";
    if (isOccupied) seatClass += "bg-gray-600 text-gray-500 cursor-not-allowed";
    else if (isSelected) seatClass += "bg-cyan-500 text-white";
    else seatClass += "bg-gray-700 text-gray-400 hover:bg-cyan-600/50";
    return <div className={seatClass} onClick={() => !isOccupied && onSelect(number)}><Armchair className="mx-auto" /><span className="text-xs font-mono">{number}</span></div>;
};

export default function PassengerAndSeatForm() {
    const { currentFlight, addPassengerAndSeatInfo, passengers, selectedSeats } = useBooking(); // Get passengers and selectedSeats to pre-fill
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { // Pre-fill form if data exists for this flight
            firstName: passengers[currentFlight?.id]?.firstName || '',
            lastName: passengers[currentFlight?.id]?.lastName || '',
            gender: passengers[currentFlight?.id]?.gender || '',
            type: passengers[currentFlight?.id]?.type || ''
        }
    });
    const [selectedSeat, setSelectedSeat] = useState(selectedSeats[currentFlight?.id] || null); // Pre-fill selected seat
    const occupiedSeats = ['3A', '8C', '5B']; // Dummy occupied seats

    const onSubmit = (data) => {
        if (!selectedSeat) {
            alert("Please select a seat."); // Consider using toast for better UX
            return;
        }
        addPassengerAndSeatInfo(currentFlight.id, data, selectedSeat);
    };

    if (!currentFlight) return <p className="text-gray-400">Loading flight information...</p>;

    const firstLeg = currentFlight.legs[0];
    const lastLeg = currentFlight.legs[currentFlight.legs.length - 1];

    return (
        <div className="animate-fade-in-up">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6">
                <p className="font-bold text-white">{currentFlight.airline.name} {currentFlight.number}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{firstLeg.departure.airport.iataCode}</span><ArrowRight size={16}/><span>{lastLeg.arrival.airport.iataCode}</span>
                </div>
                {/* Display master flight details here */}
                <div className="mt-2 text-xs text-gray-500">
                    <p>Class: {currentFlight.flight_class || 'N/A'} | Seat: {currentFlight.seat_number || 'N/A'} | Gate: {currentFlight.gate || 'N/A'} | Terminal: {currentFlight.terminal || 'N/A'}</p>
                </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">First Name</label>
                        <input {...register('firstName', { required: 'First Name is required' })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
                        {errors.firstName && <span className="text-red-400 text-xs">{errors.firstName.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Last Name</label>
                        <input {...register('lastName', { required: 'Last Name is required' })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
                        {errors.lastName && <span className="text-red-400 text-xs">{errors.lastName.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Gender</label>
                        <select {...register('gender', { required: 'Gender is required' })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        {errors.gender && <span className="text-red-400 text-xs">{errors.gender.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Passenger Type</label>
                        <select {...register('type', { required: 'Passenger Type is required' })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700">
                            <option value="">Select Type</option>
                            <option value="Adult">Adult</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                        </select>
                        {errors.type && <span className="text-red-400 text-xs">{errors.type.message}</span>}
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white pt-6">Select Your Seat</h3>
                <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto">
                    {['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'].map(seat => (
                        <Seat key={seat} number={seat} isOccupied={occupiedSeats.includes(seat)} isSelected={selectedSeat === seat} onSelect={setSelectedSeat} />
                    ))}
                </div>
                <button type="submit" className="w-full px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold mt-6">Confirm Details for this Flight</button>
            </form>
        </div>
    );
}