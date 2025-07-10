import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { X } from 'lucide-react';

// ✅ FIX: Ensure all these components exist in the same directory.
import PassengerForm from './PassengerForm';
import ReviewBooking from './ReviewBooking';
import PaymentForm from './PaymentForm';
import BookingConfirmation from './BookingConfirmation';

const stepTitles = {
  details: "Passenger Information",
  review: "Review Your Booking",
  payment: "Secure Payment",
  confirmed: "Booking Confirmed!",
};

export default function BookingModal() {
  const { isModalOpen, bookingStep, closeBookingModal } = useBooking();

  if (!isModalOpen) {
    return null;
  }

  const renderStep = () => {
    switch (bookingStep) {
      case 'details':
        return <PassengerForm />;
      case 'review':
        return <ReviewBooking />;
      case 'payment':
        return <PaymentForm />;
      case 'confirmed':
        return <BookingConfirmation />;
      default:
        return null;
    }
  };

  return (
    // Full-screen overlay
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      {/* Modal content */}
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{stepTitles[bookingStep]}</h2>
          <button onClick={closeBookingModal} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Body with scroll */}
        <div className="p-6 overflow-y-auto">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
