import React, { createContext, useState, useContext } from 'react';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
  // ✅ NEW: State to control the modal's visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [bookingStep, setBookingStep] = useState('details'); // The modal will start at the 'details' step
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);

  // ✅ NEW: Function to open the modal and start the booking flow
  const startBooking = (flight) => {
    setSelectedFlight(flight);
    setBookingStep('details'); // Reset to the first step
    setIsModalOpen(true);
  };

  const addPassengerInfo = (passengerData) => {
    setPassengers([passengerData]);
    setBookingStep('review');
  };
  
  const proceedTo = (step) => {
    setBookingStep(step);
  };

  const confirmBooking = () => {
    const bookingReference = `TT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setBookingDetails({
      flight: selectedFlight,
      passengers: passengers,
      reference: bookingReference,
    });
    setBookingStep('confirmed');
  };
  
  // ✅ NEW: Function to close the modal and reset everything
  const closeBookingModal = () => {
    setIsModalOpen(false);
    // Add a small delay to allow the modal to animate out before resetting state
    setTimeout(() => {
        setSelectedFlight(null);
        setPassengers([]);
        setBookingDetails(null);
    }, 300);
  };

  const value = {
    isModalOpen,
    bookingStep,
    selectedFlight,
    passengers,
    bookingDetails,
    startBooking,
    addPassengerInfo,
    proceedTo,
    confirmBooking,
    closeBookingModal,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};