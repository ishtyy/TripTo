import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState('cart'); // 'cart', 'details', 'review', 'payment', 'confirmed'
    const [cart, setCart] = useState([]); // Array of selected flights (from itinerary_item.flight_details)
    const [passengers, setPassengers] = useState({}); // { flightId: { firstName, lastName, gender, type } }
    const [selectedSeats, setSelectedSeats] = useState({}); // { flightId: seatNumber }
    const [currentFlightIndex, setCurrentFlightIndex] = useState(0);
    const [bookingDetails, setBookingDetails] = useState(null); // Full booking details after confirmation
    const [activeItineraryId, setActiveItineraryId] = useState(null); // Store active itinerary ID

    const currentFlight = cart[currentFlightIndex];

    // --- Fetch Itinerary on Component Mount ---
    useEffect(() => {
        const fetchItinerary = async () => {
            try {
                const response = await api.get('/bookings/itinerary');
                if (response.data) {
                    const fetchedCart = response.data.flights || [];
                    const fetchedItineraryId = response.data.itineraryId || null;

                    setCart(fetchedCart);
                    setActiveItineraryId(fetchedItineraryId);

                    const initialPassengers = {};
                    const initialSelectedSeats = {};
                    fetchedCart.forEach(flight => {
                        if (flight.passengerData) {
                            initialPassengers[flight.id] = flight.passengerData;
                        }
                        if (flight.selectedSeat) {
                            initialSelectedSeats[flight.id] = flight.selectedSeat;
                        }
                    });
                    setPassengers(initialPassengers);
                    setSelectedSeats(initialSelectedSeats);

                    if (fetchedCart.length > 0 && Object.keys(initialPassengers).length === fetchedCart.length) {
                        setBookingStep('review');
                        setCurrentFlightIndex(0);
                    } else if (fetchedCart.length > 0) {
                        setBookingStep('details');
                        const firstFlightWithoutDetailsIndex = fetchedCart.findIndex(f => !initialPassengers[f.id]);
                        setCurrentFlightIndex(firstFlightWithoutDetailsIndex !== -1 ? firstFlightWithoutDetailsIndex : 0);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch itinerary from DB:", error);
            }
        };
        fetchItinerary();
    }, []);

    // --- Modal Control Functions ---
    const openBookingModal = useCallback((initialStep = 'cart') => {
        setIsModalOpen(true);
        setBookingStep(initialStep);
    }, []);

    const closeBookingModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => {
            setBookingStep('cart');
            setPassengers({});
            setSelectedSeats({});
            setCurrentFlightIndex(0);
            setBookingDetails(null);
        }, 300);
    }, []);

    const openCartModal = useCallback(() => {
        openBookingModal('cart');
    }, [openBookingModal]);

    const proceedTo = useCallback((step) => {
        setBookingStep(step);
    }, []);

    // --- Cart Management Functions ---
    const addFlightToCart = useCallback(async (flight) => {
        if (cart.find(f => f.id === flight.id)) {
            toast.error("This flight is already in your itinerary.");
            return;
        }
        try {
            const response = await api.post('/bookings/itinerary/add', { flight });
            if (response.data && response.data.itineraryId) {
                setActiveItineraryId(response.data.itineraryId);
            }
            setCart(prevCart => {
                const newCart = [...prevCart, flight];
                if (prevCart.length === 0) {
                    openCartModal();
                }
                return newCart;
            });
            toast.success(`${flight.airline.name} ${flight.number} added to itinerary!`);
        } catch (error) {
            console.error("Failed to add flight to persistent itinerary:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to add flight to itinerary.");
        }
    }, [cart, openCartModal]);

    const removeFlightFromCart = useCallback(async (flightId) => {
        try {
            await api.post('/bookings/itinerary/remove', { flightId });
            
            setCart(prevCart => {
                const updatedCart = prevCart.filter(flight => flight.id !== flightId);
                if (updatedCart.length === 0 && isModalOpen) {
                    closeBookingModal();
                }
                setCurrentFlightIndex(prevIndex => {
                    const newIndex = Math.min(prevIndex, updatedCart.length > 0 ? updatedCart.length - 1 : 0);
                    return newIndex;
                });
                return updatedCart;
            });
            setPassengers(prevPassengers => {
                const newPassengers = { ...prevPassengers };
                delete newPassengers[flightId];
                return newPassengers;
            });
            setSelectedSeats(prevSeats => {
                const newSeats = { ...prevSeats };
                delete newSeats[flightId];
                return newSeats;
            });
            toast.success("Flight removed from itinerary.");
        } catch (error) {
            console.error("Failed to remove flight from persistent itinerary:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to remove flight from itinerary.");
        }
    }, [isModalOpen, closeBookingModal, cart.length]);

    const addPassengerAndSeatInfo = useCallback(async (flightId, passengerData, seatNumber) => {
        if (!activeItineraryId) {
            toast.error("Itinerary not loaded. Please try again.");
            console.error("Itinerary ID is missing for update details.");
            return;
        }

        try {
            // Update frontend state first for responsiveness
            setPassengers(prev => ({ ...prev, [flightId]: passengerData }));
            setSelectedSeats(prev => ({ ...prev, [flightId]: seatNumber }));

            // FIX: Update the cart item directly with passengerData and selectedSeat
            // This ensures the `cart` state always has the latest `flight_details`
            setCart(prevCart => prevCart.map(f => 
                f.id === flightId 
                    ? { ...f, passengerData: passengerData, selectedSeat: seatNumber } 
                    : f
            ));

            const flightToUpdate = cart.find(f => f.id === flightId);
            if (!flightToUpdate) {
                throw new Error("Flight not found in cart to update details.");
            }

            const updatedFlightDetails = {
                ...flightToUpdate,
                passengerData: passengerData,
                selectedSeat: seatNumber
            };

            await api.post('/bookings/itinerary/update-details', {
                itineraryId: activeItineraryId,
                bookableItemId: flightId,
                updatedFlightDetails: updatedFlightDetails
            });
            toast.success(`Details saved for ${flightId}.`);

            const nextIndex = currentFlightIndex + 1;
            if (nextIndex < cart.length) {
                setCurrentFlightIndex(nextIndex);
                toast.info(`Proceeding to next flight (${nextIndex + 1} of ${cart.length}).`);
            } else {
                setBookingStep('review');
                setCurrentFlightIndex(0);
            }
        } catch (error) {
            console.error("Failed to save passenger/seat details persistently:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to save passenger/seat details.");
        }
    }, [currentFlightIndex, cart.length, cart, activeItineraryId]);

    // FIX: confirmBooking now sends the `cart` directly as the `flights` payload
    const confirmBooking = useCallback(async () => {
        // The `cart` state already contains the `flight_details` with `passengerData` and `selectedSeat`
        // because `addPassengerAndSeatInfo` updates the `cart` state.
        const bookingData = {
            flights: cart, // Send the cart directly
            // passengers and selectedSeats are redundant if included in flights, but can be sent for verification
            passengers: passengers,
            selectedSeats: selectedSeats
        };

        try {
            const res = await api.post('/bookings', bookingData);
            setBookingDetails(res.data.booking);
            setBookingStep('confirmed');
            toast.success("Booking confirmed successfully!");
            
            setCart([]);
            setPassengers({});
            setSelectedSeats({});
            setCurrentFlightIndex(0);
            setActiveItineraryId(null);
        } catch (error) {
            console.error("Booking confirmation failed:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to confirm booking. Please try again.");
            setBookingStep('review');
        }
    }, [cart, passengers, selectedSeats]);

    const value = useMemo(() => ({
        isModalOpen,
        bookingStep,
        cart,
        passengers,
        selectedSeats,
        currentFlight,
        bookingDetails,
        openBookingModal,
        closeBookingModal,
        openCartModal,
        proceedTo,
        addFlightToCart,
        removeFlightFromCart,
        addPassengerAndSeatInfo,
        confirmBooking,
    }), [
        isModalOpen,
        bookingStep,
        cart,
        passengers,
        selectedSeats,
        currentFlight,
        bookingDetails,
        openBookingModal,
        closeBookingModal,
        openCartModal,
        proceedTo,
        addFlightToCart,
        removeFlightFromCart,
        addPassengerAndSeatInfo,
        confirmBooking,
    ]);

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
};