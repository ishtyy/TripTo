import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { X } from 'lucide-react';

// Import all the components that represent a step in the booking process
import BookingCart from './BookingCart';
import PassengerAndSeatForm from './PassengerAndSeatForm';
import ReviewBooking from './ReviewBooking';
import PaymentForm from './PaymentForm';
import BookingConfirmation from './BookingConfirmation';

// Titles for each step to be displayed in the modal header
const stepTitles = {
  cart: "Your Itinerary",
  details: "Passenger & Seat Details",
  review: "Review Your Booking",
  payment: "Secure Payment",
  confirmed: "Booking Confirmed!",
};

export default function BookingModal() {
  // Get the current state and functions from our BookingContext
  const { isModalOpen, bookingStep, closeBookingModal, currentFlight, cart } = useBooking();

  // If the modal is not supposed to be open, render nothing.
  if (!isModalOpen) {
    return null;
  }

  // This function determines which component to show based on the current bookingStep
  const renderStep = () => {
    switch (bookingStep) {
      case 'cart':
        return <BookingCart />;
      case 'details':
        return <PassengerAndSeatForm />;
      case 'review':
        return <ReviewBooking />;
      case 'payment':
        return <PaymentForm />;
      case 'confirmed':
        return <BookingConfirmation />;
      default:
        // Fallback in case of an unknown step
        return <p>An unexpected error occurred.</p>;
    }
  };

  // This function dynamically changes the modal title based on the current step
  const getStepTitle = () => {
      // For the 'details' step, we add extra context to show progress
      if (bookingStep === 'details' && currentFlight) {
          const currentIndex = cart.findIndex(flight => flight.id === currentFlight.id);
          return `Details for Flight ${currentIndex + 1} of ${cart.length}`;
      }
      return stepTitles[bookingStep] || 'Booking';
  }

  return (
    // Full-screen overlay to dim the background
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      
      {/* The main modal container */}
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Modal Header with dynamic title and close button */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{getStepTitle()}</h2>
          <button onClick={closeBookingModal} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Body where the current step's component is rendered */}
        <div className="p-6 overflow-y-auto">
          {renderStep()}
        </div>

      </div>
    </div>
  );
}