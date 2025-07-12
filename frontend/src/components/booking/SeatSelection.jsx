import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Armchair } from 'lucide-react';

const Seat = ({ number, isOccupied, isSelected, onSelect }) => {
    let seatClass = "p-2 rounded-t-lg cursor-pointer transition-colors ";
    if (isOccupied) {
        seatClass += "bg-gray-600 text-gray-500 cursor-not-allowed";
    } else if (isSelected) {
        seatClass += "bg-cyan-500 text-white";
    } else {
        seatClass += "bg-gray-700 text-gray-400 hover:bg-cyan-600/50";
    }

    return (
        <div className={seatClass} onClick={() => !isOccupied && onSelect(number)}>
            <Armchair className="mx-auto" />
            <span className="text-xs font-mono">{number}</span>
        </div>
    );
};

export default function SeatSelection() {
    const { cart, addSeatInfo, proceedTo } = useBooking();
    const [selectedSeats, setSelectedSeats] = useState({});

    const occupiedSeats = ['3A', '3B', '8C', '11F'];

    const handleSelectSeat = (flightId, seatNumber) => {
        setSelectedSeats(prev => ({...prev, [flightId]: seatNumber }));
    };

    const handleConfirmSeats = () => {
        if (Object.keys(selectedSeats).length !== cart.length) {
            alert("Please select a seat for each flight in your itinerary.");
            return;
        }
        addSeatInfo(selectedSeats);
        proceedTo('review');
    };

    return (
        <div className="animate-fade-in-up space-y-6">
            <h2 className="text-2xl font-bold text-white">Choose Your Seats</h2>
            {cart.map(flight => (
                <div key={flight.id} className="p-4 border border-gray-800 rounded-lg">
                    <h3 className="font-semibold text-cyan-400 mb-4">{flight.airline.name} {flight.number}</h3>
                    <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto">
                        {['1A', '1B', '1C', '1D', '1E', '1F', '2A', '2B', '2C', '2D', '2E', '2F', '3A', '3B', '3C', '3D', '3E', '3F'].map(seatNumber => (
                            <Seat 
                                key={seatNumber}
                                number={seatNumber}
                                isOccupied={occupiedSeats.includes(seatNumber)}
                                isSelected={selectedSeats[flight.id] === seatNumber}
                                onSelect={(num) => handleSelectSeat(flight.id, num)}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={handleConfirmSeats} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
                Confirm Seats & Continue
            </button>
        </div>
    );
}