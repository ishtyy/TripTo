import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState('cart');
  const [cart, setCart] = useState([]);
  const [passengers, setPassengers] = useState({}); // e.g., { flightId: { ...passengerData } }
  const [selectedSeats, setSelectedSeats] = useState({});
  const [bookingDetails, setBookingDetails] = useState(null);
  const [currentFlightIndex, setCurrentFlightIndex] = useState(0);

  // In a real app with user auth, you would fetch this for the logged-in user
  useEffect(() => {
    const fetchItinerary = async () => {
        try {
            // This is a placeholder for fetching a user's saved cart.
            // For now, it will start empty on each page load.
        } catch (error) {
            console.error("Could not fetch itinerary.", error);
        }
    };
    fetchItinerary();
  }, []);

  const addFlightToCart = (flight) => {
    setCart(prevCart => [...prevCart, flight]);
    toast.success(`${flight.airline.name} flight added to itinerary!`);
  };

  const viewCart = () => {
    if (cart.length > 0) {
      setCurrentFlightIndex(0);
      setBookingStep('details');
      setIsModalOpen(true);
    } else {
      toast.error("Your itinerary is empty.");
    }
  };

  const addPassengerAndSeatInfo = (flightId, passengerData, seat) => {
    setPassengers(prev => ({ ...prev, [flightId]: passengerData }));
    setSelectedSeats(prev => ({ ...prev, [flightId]: seat }));

    const nextIndex = currentFlightIndex + 1;
    if (nextIndex < cart.length) {
      setCurrentFlightIndex(nextIndex);
    } else {
      setBookingStep('review');
    }
  };
  
  const proceedTo = (step) => {
    setBookingStep(step);
  };

  const confirmBooking = async () => {
    const finalBookingPayload = { flights: cart, passengers, seats: selectedSeats };
    try {
      const { data } = await api.post('/bookings', finalBookingPayload);
      setBookingDetails(data.booking);
      setBookingStep('confirmed');
      setCart([]);
    } catch (error) {
      console.error("Failed to save booking:", error);
      toast.error("There was an error confirming your booking.");
    }
  };
  
  const closeBookingModal = () => {
    setIsModalOpen(false);
    // A short delay to allow the modal to animate out before resetting state
    setTimeout(() => {
        setBookingStep('cart');
        setPassengers({});
        setSelectedSeats({});
        setBookingDetails(null);
    }, 300);
  };

  const value = {
    isModalOpen,
    bookingStep,
    cart,
    passengers,
    selectedSeats,
    bookingDetails,
    currentFlight: cart[currentFlightIndex],
    addFlightToCart,
    viewCart,
    addPassengerAndSeatInfo,
    confirmBooking,
    closeBookingModal,
    // ✅ FIX: Exporting the proceedTo function so other components can use it
    proceedTo
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
