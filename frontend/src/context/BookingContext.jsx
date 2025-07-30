import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState('cart'); // 'cart', 'details', 'review', 'payment', 'confirmed'
    const [cart, setCart] = useState([]); // Array of selected flights (from itinerary_item.flight_details)
    const [cartItems, setCartItems] = useState([]);
    const [passengers, setPassengers] = useState({}); // { flightId: { firstName, lastName, gender, type } }
    const [selectedSeats, setSelectedSeats] = useState({}); // { flightId: seatNumber }
    const [currentFlightIndex, setCurrentFlightIndex] = useState(0);
    const [bookingDetails, setBookingDetails] = useState(null); // Full booking details after confirmation
    const [activeItineraryId, setActiveItineraryId] = useState(null); // Store active itinerary ID

    const currentFlight = cart[currentFlightIndex];

    // --- Fetch Itinerary on Component Mount ---
    useEffect(() => {
        const fetchItineraryAndPendingBookings = async () => {
            try {
                // Fetch the flight itinerary (for existing functionality)
                const itineraryResponse = await api.get('/bookings/itinerary');
                if (itineraryResponse.data) {
                    const fetchedCart = itineraryResponse.data.flights || [];
                    const fetchedItineraryId = itineraryResponse.data.itineraryId || null;

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

                // Fetch comprehensive itinerary and filter for pending bookings
                const comprehensiveResponse = await api.get('/bookings/itinerary/comprehensive');
                if (comprehensiveResponse.data) {
                    const allBookings = comprehensiveResponse.data.itinerary || [];
                    const pending = allBookings.filter(booking => booking.status === 'pending');
                    setPendingBookings(pending);
                }
            } catch (error) {
                console.error("Failed to fetch itinerary from DB:", error);
            }
        };
        fetchItineraryAndPendingBookings();
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


    const addHotelToCart = useCallback(async (hotelBooking) => {
        try {
            // Check if hotel booking already exists
            if (cartItems.find(item => item.type === 'hotel' && item.id === hotelBooking.id)) {
                toast.error("This hotel booking is already in your cart.");
                return;
            }

            const cartItem = {
                id: hotelBooking.id || `hotel_${Date.now()}`,
                type: 'hotel',
                data: hotelBooking,
                title: hotelBooking.hotel_name,
                subtitle: `${hotelBooking.room_type} • ${hotelBooking.guests} guests`,
                price: hotelBooking.total_price,
                dates: {
                    check_in: hotelBooking.check_in_date,
                    check_out: hotelBooking.check_out_date
                }
            };

            setCartItems(prevItems => {
                const newItems = [...prevItems, cartItem];
                if (prevItems.length === 0) {
                    openBookingModal('cart');
                }
                return newItems;
            });

            toast.success(`${hotelBooking.hotel_name} added to cart!`);
        } catch (error) {
            console.error("Failed to add hotel to cart:", error);
            toast.error("Failed to add hotel to cart.");
        }
    }, [cartItems, openBookingModal]);

    const addPackageToCart = useCallback(async (packageBooking) => {
        try {
            // Check if package booking already exists
            if (cartItems.find(item => item.type === 'package' && item.id === packageBooking.id)) {
                toast.error("This package is already in your cart.");
                return;
            }

            const cartItem = {
                id: packageBooking.id || `package_${Date.now()}`,
                type: 'package',
                data: packageBooking,
                title: packageBooking.package_name,
                subtitle: packageBooking.destination,
                price: packageBooking.total_price,
                dates: {
                    start_date: packageBooking.start_date,
                    end_date: packageBooking.end_date
                }
            };

            setCartItems(prevItems => {
                const newItems = [...prevItems, cartItem];
                if (prevItems.length === 0) {
                    openBookingModal('cart');
                }
                return newItems;
            });

            toast.success(`${packageBooking.package_name} added to cart!`);
        } catch (error) {
            console.error("Failed to add package to cart:", error);
            toast.error("Failed to add package to cart.");
        }
    }, [cartItems, openBookingModal]);

    // Update the existing addFlightToCart to use the new unified cart
    const addFlightToCart = useCallback(async (flight) => {
        try {
            if (cartItems.find(item => item.type === 'flight' && item.id === flight.id)) {
                toast.error("This flight is already in your cart.");
                return;
            }

            const cartItem = {
                id: flight.id,
                type: 'flight',
                data: flight,
                title: `${flight.airline.name} ${flight.number}`,
                subtitle: `${flight.departure_airport} → ${flight.arrival_airport}`,
                price: flight.price,
                dates: {
                    departure_time: flight.departure_time,
                    arrival_time: flight.arrival_time
                }
            };

            // Also add to the old cart for backward compatibility
            setCart(prevCart => [...prevCart, flight]);

            setCartItems(prevItems => {
                const newItems = [...prevItems, cartItem];
                if (prevItems.length === 0) {
                    openBookingModal('cart');
                }
                return newItems;
            });

            toast.success(`${flight.airline.name} ${flight.number} added to cart!`);
        } catch (error) {
            console.error("Failed to add flight to cart:", error);
            toast.error("Failed to add flight to cart.");
        }
    }, [cartItems, openBookingModal]);

    // Add remove function for unified cart
    const removeFromCart = useCallback((itemId) => {
        setCartItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.id !== itemId);

            // Also remove from flight cart if it's a flight
            const removedItem = prevItems.find(item => item.id === itemId);
            if (removedItem && removedItem.type === 'flight') {
                setCart(prevCart => prevCart.filter(flight => flight.id !== itemId));
                // Remove passenger data for flights
                setPassengers(prevPassengers => {
                    const newPassengers = { ...prevPassengers };
                    delete newPassengers[itemId];
                    return newPassengers;
                });
                setSelectedSeats(prevSeats => {
                    const newSeats = { ...prevSeats };
                    delete newSeats[itemId];
                    return newSeats;
                });
            }

            if (updatedItems.length === 0 && isModalOpen) {
                closeBookingModal();
            }

            return updatedItems;
        });
        toast.success("Item removed from cart");
    }, [isModalOpen, closeBookingModal]);

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
            // Try to refresh the itinerary first
            try {
                const response = await api.get('/bookings/itinerary');
                if (response.data && response.data.itineraryId) {
                    setActiveItineraryId(response.data.itineraryId);
                } else {
                    toast.error("No active itinerary found. Please add flights to your cart first.");
                    console.error("Itinerary ID is missing for update details. No active itinerary found.");
                    return;
                }
            } catch (error) {
                toast.error("Failed to load itinerary. Please try again.");
                console.error("Itinerary ID is missing for update details. Failed to fetch itinerary:", error);
                return;
            }
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

            // Use the potentially refreshed activeItineraryId
            const itineraryIdToUse = activeItineraryId || (await api.get('/bookings/itinerary')).data?.itineraryId;

            if (!itineraryIdToUse) {
                throw new Error("Unable to determine itinerary ID for update.");
            }

            await api.post('/bookings/itinerary/update-details', {
                itineraryId: itineraryIdToUse,
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
        try {
            const bookingPromises = [];
            const successfulBookings = [];

            for (const item of cartItems) {
                if (item.type === 'flight') {
                    // Handle flight booking (existing logic)
                    const flightBookingData = {
                        flights: [item.data], // Single flight
                        passengers: passengers,
                        selectedSeats: selectedSeats
                    };
                    bookingPromises.push(
                        api.post('/bookings', flightBookingData)
                            .then(res => ({ type: 'flight', data: res.data.booking }))
                    );
                } else if (item.type === 'hotel') {
                    // Handle hotel booking
                    const hotelBookingData = {
                        hotel_id: item.data.hotel_id,
                        room_type: item.data.room_type,
                        check_in_date: item.data.check_in_date,
                        check_out_date: item.data.check_out_date,
                        guests: item.data.guests,
                        total_price: item.data.total_price,
                        special_requests: item.data.special_requests || ''
                    };
                    bookingPromises.push(
                        api.post('/hotels/book', hotelBookingData)
                            .then(res => ({ type: 'hotel', data: res.data.booking }))
                    );
                } else if (item.type === 'package') {
                    // Handle package booking
                    const packageBookingData = {
                        package_id: item.data.package_id,
                        passenger_details: [{
                            firstName: 'Guest',
                            lastName: 'User',
                            email: 'guest@example.com',
                            phone: '',
                            dateOfBirth: '',
                            passportNumber: ''
                        }],
                        total_amount: item.data.total_price,
                        original_amount: item.data.total_price,
                        discount_amount: 0
                    };
                    bookingPromises.push(
                        api.post('/packages/book', packageBookingData)
                            .then(res => ({ type: 'package', data: res.data.booking }))
                    );
                }
            }

            // Execute all booking requests
            const results = await Promise.all(bookingPromises);
            successfulBookings.push(...results);

            // Set booking details and proceed to confirmation
            setBookingDetails({
                bookings: successfulBookings,
                total_items: successfulBookings.length
            });
            setBookingStep('confirmed');
            toast.success(`${successfulBookings.length} booking(s) confirmed successfully!`);

            // Clear all cart states
            setCart([]);
            setCartItems([]);
            setPassengers({});
            setSelectedSeats({});
            setCurrentFlightIndex(0);
            setActiveItineraryId(null);

        } catch (error) {
            console.error("Booking confirmation failed:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to confirm booking. Please try again.");
            setBookingStep('review');
        }
    }, [cartItems, cart, passengers, selectedSeats]);

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
        <BookingContext.Provider value={{
            isModalOpen,
            bookingStep,
            cart,
            cartItems,                // Add this
            passengers,
            selectedSeats,
            currentFlight,
            bookingDetails,
            pendingBookings,
            openBookingModal,
            closeBookingModal,
            openCartModal,
            proceedTo,
            addFlightToCart,
            addHotelToCart,           // Add this
            addPackageToCart,         // Add this
            removeFromCart,           // Add this
            removeFlightFromCart,     // Keep for backward compatibility
            addPassengerAndSeatInfo,
            confirmBooking,
        }}>
            {children}
        </BookingContext.Provider>
    );
};