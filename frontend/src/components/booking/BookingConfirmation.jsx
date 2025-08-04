import React from "react";
import { useBooking } from "../../context/BookingContext";
// FIX: Import X icon
import {
  CheckCircle,
  Plane,
  ArrowRight,
  User,
  Hash,
  Clock,
  Mail,
  DollarSign,
  Briefcase,
  X,
} from "lucide-react"; // Added X icon

// Helper functions (assuming they are defined or imported elsewhere)
const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  if (includeTime) {
    options.hour = "2-digit";
    (options.minute = "2-digit"), (options.hour12 = true);
  }
  return date.toLocaleDateString(undefined, options);
};

const formatDuration = (minutes) => {
  if (typeof minutes !== "number" || minutes < 0) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export default function BookingConfirmation() {
  const { bookingDetails, closeBookingModal } = useBooking();

  if (!bookingDetails || !bookingDetails.bookings || bookingDetails.bookings.length === 0) return null;

  const { bookings, total_items } = bookingDetails;
  const firstBooking = bookings?.[0] || {};
  const { booking_id, booked_at, user_info, flights = [], invoice_info } =
    firstBooking;
  const primaryPassenger = flights?.[0]?.passengerData || user_info;

  const totalAmount =
    invoice_info?.invoice_items_summary?.reduce(
      (sum, item) => sum + parseFloat(item.final_price || 0),
      0
    ) || 0;

  return (
    <div className="animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-auto max-h-[90vh] flex flex-col text-gray-800 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-700">
            Booking Confirmation
          </h2>
          <button
            onClick={closeBookingModal}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} /> {/* X icon used here */}
          </button>
        </div>

        {/* Confirmation Message */}
        <div className="p-6 text-center">
          <CheckCircle className="mx-auto h-20 w-20 text-green-600 mb-4" />
          <h3 className="text-3xl font-bold text-green-700 mb-2">
            Your Booking is Confirmed!
          </h3>
          <p className="text-gray-600">
            Thank you for choosing us. Your travel plans are secured.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            A detailed e-ticket and invoice have been sent to:{" "}
            <span className="font-semibold text-blue-600">
              {user_info?.email || "your_email@example.com"}
            </span>
          </p>
        </div>

        {/* Booking Summary Section */}
        <div className="p-6 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <h4 className="text-lg font-semibold text-blue-600 mb-2 flex items-center">
              <Briefcase size={18} className="mr-2" />
              Booking Reference
            </h4>
            <p className="text-xl font-bold text-gray-800">
              {booking_id?.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500">
              Booked On: {formatDate(booked_at)}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-600 mb-2 flex items-center">
              <User size={18} className="mr-2" />
              Primary Passenger
            </h4>
            <p className="text-xl font-bold text-gray-800">
              {primaryPassenger?.firstName} {primaryPassenger?.lastName}
            </p>
            <p className="text-sm text-gray-500">Email: {user_info?.email}</p>
          </div>
        </div>

        {/* Itinerary Details */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
            <Plane size={18} className="mr-2" />
            Your Itinerary
          </h4>
          <div className="space-y-6">
            {flights && flights.length > 0 ? flights.map((flight, index) => (
              <div
                key={flight.id || index}
                className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-blue-700">
                    {flight.airline.name} ({flight.number})
                  </p>
                  <p className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                    <Clock size={14} />{" "}
                    {formatDuration(flight.totalDurationMinutes)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <p>
                    <strong className="text-gray-600">From:</strong>{" "}
                    {flight.legs?.[0]?.departure?.airport?.iataCode} (
                    {flight.legs?.[0]?.departure?.airport?.name})
                  </p>
                  <p>
                    <strong className="text-gray-600">To:</strong>{" "}
                    {
                      flight.legs?.[flight.legs.length - 1]?.arrival?.airport
                        ?.iataCode
                    }{" "}
                    (
                    {
                      flight.legs?.[flight.legs.length - 1]?.arrival?.airport
                        ?.name
                    }
                    )
                  </p>
                  <p>
                    <strong className="text-gray-600">Dep:</strong>{" "}
                    {formatDate(flight.legs?.[0]?.departure?.scheduledTime)}
                  </p>
                  <p>
                    <strong className="text-gray-600">Arr:</strong>{" "}
                    {formatDate(
                      flight.legs?.[flight.legs?.length - 1]?.arrival
                        ?.scheduledTime
                    )}
                  </p>
                  <p>
                    <strong className="text-gray-600">Class:</strong>{" "}
                    {flight.flight_class || "N/A"}
                  </p>
                  <p>
                    <strong className="text-gray-600">Seat:</strong>{" "}
                    {flight.selectedSeat || "N/A"}
                  </p>
                </div>
                {flight.legs && flight.legs.length > 1 && (
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    Includes {flight.legs.length - 1} layover(s).
                  </p>
                )}
              </div>
            )) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-500">No flight information available</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
            <DollarSign size={18} className="mr-2" />
            Payment Summary
          </h4>
          <div className="flex justify-between items-center text-xl font-bold text-gray-800">
            <span>Total Amount:</span>
            <span className="text-green-700">${totalAmount.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Your invoice is marked as "unpaid". Please proceed with payment via
            your profile or the invoice link in your email.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={closeBookingModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
