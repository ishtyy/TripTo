import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { X } from 'lucide-react';

// Import all the components that represent a step in the booking process
import BookingCart from './BookingCart';
import PassengerAndSeatForm from './PassengerAndSeatForm';
import ReviewBooking from './ReviewBooking';
import PaymentForm from './PaymentForm';
import BookingConfirmation from './BookingConfirmation';
import UnifiedBookingCart from './UnifiedBookingCart';
import UnifiedBookingDetails from './UnifiedBookingDetails';

// Titles for each step to be displayed in the modal header
const stepTitles = {
    cart: "Your Itinerary",
    pendingBookings: "Pending Bookings",
    details: "Passenger & Seat Details",
    review: "Review Your Booking",
    payment: "Secure Payment",
    confirmed: "Booking Confirmed!",
};

export default function BookingModal() {
    // Get the current state and functions from our BookingContext
    const { isModalOpen, bookingStep, closeBookingModal, currentFlight, cart, pendingBookings } = useBooking();

    // If the modal is not supposed to be open, render nothing.
    if (!isModalOpen) {
        return null;
    }

    // Update the renderStep function
    const renderStep = () => {
        switch (bookingStep) {
            case 'cart':
                if (pendingBookings && pendingBookings.length > 0) {
                    return <PendingBookingsView pendingBookings={pendingBookings} />;
                }
                return <UnifiedBookingCart />;
            case 'details':
                return <UnifiedBookingDetails />; // Use the new unified component
            case 'review':
                return <ReviewBooking />;
            case 'payment':
                return <PaymentForm />;
            case 'confirmed':
                return <BookingConfirmation />;
            default:
                return <p className="text-red-400">An unexpected error occurred in booking process.</p>;
        }
    };

    // This function dynamically changes the modal title based on the current step
    const getStepTitle = () => {
        if (bookingStep === 'cart') {
            if (pendingBookings && pendingBookings.length > 0) {
                return 'Pending Bookings';
            }
            return 'Shopping Cart';
        }

        if (bookingStep === 'details') {
            return 'Booking Details';
        }

        return stepTitles[bookingStep] || 'Booking';
    }

    const PendingBookingsView = ({ pendingBookings }) => {
        const getBookingTypeInfo = (booking) => {
            if (booking.hotel_bookings && booking.hotel_bookings.length > 0) {
                const hotel = booking.hotel_bookings[0];
                return {
                    type: 'Hotel',
                    icon: '🏨',
                    title: hotel.hotel_name,
                    subtitle: `${hotel.room_type} • ${hotel.guest_count} guests`,
                    details: `Check-in: ${new Date(hotel.check_in_date).toLocaleDateString()}`
                };
            } else if (booking.package_bookings && booking.package_bookings.length > 0) {
                const pkg = booking.package_bookings[0];
                return {
                    type: 'Package',
                    icon: '📦',
                    title: pkg.package_name,
                    subtitle: pkg.destination,
                    details: `Start: ${new Date(pkg.start_date).toLocaleDateString()}`
                };
            } else if (booking.items && booking.items.length > 0) {
                const flight = booking.items[0];
                return {
                    type: 'Flight',
                    icon: '✈️',
                    title: flight.title,
                    subtitle: `${flight.departure_airport} → ${flight.arrival_airport}`,
                    details: `Departure: ${new Date(flight.departure_time).toLocaleDateString()}`
                };
            }
            return {
                type: 'Unknown',
                icon: '📄',
                title: 'Booking',
                subtitle: 'Details unavailable',
                details: `Booked: ${new Date(booking.booked_at).toLocaleDateString()}`
            };
        };

        return (
            <div className="space-y-4">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Bookings Awaiting Approval</h3>
                    <p className="text-sm text-gray-400">
                        These bookings are pending admin approval. You'll receive a notification once they're processed.
                    </p>
                </div>

                {pendingBookings.length > 0 ? (
                    <div className="space-y-3">
                        {pendingBookings.map(booking => {
                            const info = getBookingTypeInfo(booking);
                            return (
                                <div key={booking.booking_id} className="p-4 bg-gray-800/50 rounded-lg border border-orange-500/30 hover:border-orange-500/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">{info.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-white">{info.title}</p>
                                                <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full">
                                                    {info.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-1">{info.subtitle}</p>
                                            <p className="text-xs text-gray-500">{info.details}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                                <p className="text-xs text-orange-400 font-medium">Pending Approval</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                ID: {booking.booking_id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(booking.booked_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📋</span>
                        </div>
                        <p className="text-gray-400 mb-2">No pending bookings</p>
                        <p className="text-sm text-gray-500">All your bookings have been processed</p>
                    </div>
                )}
            </div>
        );
    };
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