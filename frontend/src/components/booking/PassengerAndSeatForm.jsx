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
  const { currentFlight, addPassengerAndSeatInfo } = useBooking();
  const { register, handleSubmit } = useForm();
  const [selectedSeat, setSelectedSeat] = useState(null);
  const occupiedSeats = ['3A', '8C', '5B'];

  const onSubmit = (data) => {
    if (!selectedSeat) { alert("Please select a seat."); return; }
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
        </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div><label>First Name</label><input {...register('firstName', { required: true })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800" /></div>
            <div><label>Last Name</label><input {...register('lastName', { required: true })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800" /></div>
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
