import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Loader2, Plane, User, Briefcase, DollarSign, MapPin, Clock, ArrowRightCircle, AlertTriangle, PlaneTakeoff, Hotel, Activity } from 'lucide-react';

// Helper functions remain the same
const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
    }
    return date.toLocaleDateString(undefined, options);
};

const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDuration = (minutes) => {
    if (typeof minutes !== 'number' || minutes < 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

// Reusable BoardingPass component for each flight segment
const BoardingPass = ({ segment, passenger, travelDate }) => {
    if (!segment) return null;

    return (
        <div className="bg-white text-gray-800 p-6 rounded-lg shadow-xl border border-blue-200 relative overflow-hidden mt-4">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <Plane size={150} className="text-blue-500 transform rotate-12 -translate-x-1/4" />
            </div>
            <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-4 mb-4 relative z-10">
                <h3 className="text-2xl font-bold text-blue-700">BOARDING PASS</h3>
                <span className="text-lg font-mono text-gray-600 flex items-center">
                    <PlaneTakeoff size={20} className="mr-2 text-blue-500"/> {segment.airline || 'Airline'}
                </span>
            </div>
            <div className="flex items-center justify-between text-center mb-6 px-4 relative z-10">
                <div className="flex flex-col items-center">
                    <MapPin size={24} className="text-blue-500 mb-1" />
                    <span className="text-sm text-gray-600 font-semibold">FROM</span>
                    <span className="text-3xl font-extrabold text-blue-800">{segment.origin_iata || '???'}</span>
                    <span className="text-sm text-gray-500">{segment.origin_name || 'Origin'}</span>
                </div>
                <div className="flex flex-col items-center mx-2">
                    <Plane size={36} className="text-blue-500" />
                    <span className="text-xs text-gray-500">{formatDuration(segment.duration_minutes)}</span>
                </div>
                <div className="flex flex-col items-center">
                    <MapPin size={24} className="text-blue-500 mb-1" />
                    <span className="text-sm text-gray-600 font-semibold">TO</span>
                    <span className="text-3xl font-extrabold text-blue-800">{segment.destination_iata || '???'}</span>
                    <span className="text-sm text-gray-500">{segment.destination_name || 'Destination'}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm text-gray-700 font-mono mt-6 pt-4 border-t border-dashed border-gray-300 relative z-10">
                <div><span className="text-blue-500 text-xs block">PASSENGER</span><span className="font-semibold">{passenger.name?.toUpperCase() || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">FLIGHT</span><span className="font-semibold">{segment.flight_number || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">DATE</span><span className="font-semibold">{formatDate(travelDate, false)}</span></div>
                <div><span className="text-blue-500 text-xs block">DEPARTS</span><span className="font-semibold">{formatTime(segment.departure_time)}</span></div>
                <div><span className="text-blue-500 text-xs block">CLASS</span><span className="font-semibold">{segment.flight_class || 'ECONOMY'}</span></div>
                <div><span className="text-blue-500 text-xs block">SEAT</span><span className="font-semibold">{segment.seat_number || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">GATE</span><span className="font-semibold">{segment.gate || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">TERMINAL</span><span className="font-semibold">{segment.terminal || 'N/A'}</span></div>
            </div>
             <p className="text-center mt-6 text-xs font-mono text-gray-500 relative z-10">SEGMENT ID: {segment.segment_id}</p>
        </div>
    );
};


export default function BookingStatementModal({ open, onClose, bookingId }) {
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && bookingId) {
            setLoading(true);
            setError('');
            api.get(`/bookings/${bookingId}`)
                .then(res => setBookingDetails(res.data))
                .catch(err => {
                    console.error("Error fetching user booking details:", err);
                    setError(err.response?.data?.message || 'Could not load booking details.');
                })
                .finally(() => setLoading(false));
        }
    }, [open, bookingId]);

    if (!open) return null;

    // Loading and Error states
    if (loading) return <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"><Loader2 className="animate-spin text-cyan-400" size={48} /><p className="text-white ml-4">Loading...</p></div>;
    if (error) return <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"><div className="bg-gray-900 p-8 rounded-lg text-center"><p className="text-red-400 mb-4">{error}</p><button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded">Close</button></div></div>;
    if (!bookingDetails) return null;

    const { booking_id, booked_at, travel_date, status, user_info, booked_items, invoice_info } = bookingDetails;
    const payment = invoice_info?.payments?.[0];

    const flightItems = booked_items?.filter(item => item.type === 'flight') || [];
    const accommodationItems = booked_items?.filter(item => item.type === 'accommodation') || [];
    const activityItems = booked_items?.filter(item => item.type === 'activity') || [];
    
    const getStatusClass = (s) => s === 'approved' ? 'text-green-400' : s === 'pending' ? 'text-orange-400' : 'text-red-400';
    const isBookingApproved = status === 'approved';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Booking Statement</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto text-gray-300">
                    {/* RESTORED: User and Booking Summary Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-cyan-400 flex items-center mb-2"><User size={18} className="mr-2"/>User Info</h3>
                            <p><strong className="text-gray-400">Username:</strong> {user_info?.username || 'N/A'}</p>
                            <p><strong className="text-gray-400">Email:</strong> {user_info?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-cyan-400 flex items-center mb-2"><Briefcase size={18} className="mr-2"/>Booking Summary</h3>
                            <p><strong className="text-gray-400">Booking ID:</strong> {booking_id?.slice(0, 8).toUpperCase() || 'N/A'}</p>
                            <p><strong className="text-gray-400">Status:</strong> <span className={`font-semibold capitalize ${getStatusClass(status)}`}>{status || 'N/A'}</span></p>
                            <p><strong className="text-gray-400">Booked On:</strong> {formatDate(booked_at)}</p>
                            <p><strong className="text-gray-400">Travel Date:</strong> {formatDate(travel_date, false)}</p>
                        </div>
                    </div>

                    {/* RESTORED: Detailed Payment Info */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6">
                        <h3 className="text-lg font-semibold text-cyan-400 flex items-center mb-3"><DollarSign size={18} className="mr-2"/>Payment Details</h3>
                        {invoice_info?.invoice_id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <p><strong className="text-gray-400">Invoice ID:</strong> {invoice_info.invoice_id?.slice(0, 8).toUpperCase()}</p>
                                <p><strong className="text-gray-400">Total Amount:</strong> <span className="text-white font-bold">${invoice_info.total_amount?.toFixed(2)}</span></p>
                                {payment ? (
                                    <>
                                        <p><strong className="text-gray-400">Amount Paid:</strong> <span className="text-green-400 font-bold">${payment.amount?.toFixed(2)}</span></p>
                                        <p><strong className="text-gray-400">Method:</strong> {payment.method}</p>
                                        <p><strong className="text-gray-400">Payment Date:</strong> {formatDate(payment.payment_date)}</p>
                                        <p><strong className="text-gray-400">Payment Status:</strong> <span className="capitalize">{payment.status}</span></p>
                                    </>
                                ) : <p className="text-gray-500 md:col-span-2">No payment has been recorded for this invoice.</p>}
                            </div>
                        ) : <p className="text-gray-500">No payment information available.</p>}
                    </div>

                    {/* RESTORED: Categorized and Detailed Booked Items List */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6">
                        <h3 className="text-lg font-semibold text-cyan-400 flex items-center mb-3"><Briefcase size={18} className="mr-2"/>Booked Items</h3>
                        <div className="space-y-4">
                            {flightItems.map((item) => (
                                <div key={item.item_id} className="p-3 bg-gray-700/50 rounded-md">
                                    <p className="font-semibold text-white flex items-center"><Plane size={16} className="mr-2"/>Flight: {item.flight_info?.airline} {item.flight_info?.flight_number}</p>
                                    <p className="text-sm text-gray-400 ml-8">Passenger: {item.passenger_name}</p>
                                    <p className="text-sm text-gray-400 ml-8">Route: {item.flight_info?.origin_iata} to {item.flight_info?.destination_iata}</p>
                                </div>
                            ))}
                            {accommodationItems.map((item) => (
                                <div key={item.item_id} className="p-3 bg-gray-700/50 rounded-md">
                                    <p className="font-semibold text-white flex items-center"><Hotel size={16} className="mr-2"/>Hotel: {item.title}</p>
                                    <p className="text-sm text-gray-400 ml-8">{item.description}</p>
                                    <p className="text-sm text-gray-400 ml-8">Price: ${item.price?.toFixed(2)} x {item.quantity}</p>
                                </div>
                            ))}
                            {activityItems.map((item) => (
                                <div key={item.item_id} className="p-3 bg-gray-700/50 rounded-md">
                                    <p className="font-semibold text-white flex items-center"><Activity size={16} className="mr-2"/>Activity: {item.title}</p>
                                    <p className="text-sm text-gray-400 ml-8">{item.description}</p>
                                    <p className="text-sm text-gray-400 ml-8">Price: ${item.price?.toFixed(2)} x {item.quantity}</p>
                                </div>
                            ))}
                             {booked_items.length === 0 && <p className="text-gray-500">No items found in this booking.</p>}
                        </div>
                    </div>
                    
                    {/* IMPROVED: Boarding Pass Section - Renders a pass FOR EACH segment */}
                    {isBookingApproved ? (
                        <div className="space-y-6">
                             <h3 className="text-lg font-semibold text-cyan-400 flex items-center mb-3"><PlaneTakeoff size={18} className="mr-2"/>Your Boarding Passes</h3>
                            {flightItems.map(flight => (
                                Array.isArray(flight.segments) && flight.segments.length > 0 ? (
                                    flight.segments.map(segment => (
                                        <BoardingPass
                                            key={segment.segment_id}
                                            segment={segment}
                                            passenger={{ name: flight.passenger_name || user_info?.username }}
                                            travelDate={travel_date}
                                        />
                                    ))
                                ) : (
                                    <div className="bg-gray-800/50 p-6 rounded-lg text-center text-gray-400" key={flight.item_id}>
                                        <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
                                        <p>Flight details for {flight.flight_info?.airline} are incomplete. No segments found.</p>
                                    </div>
                                )
                            ))}
                            {flightItems.length === 0 && (
                                 <div className="bg-gray-800/50 p-6 rounded-lg text-center text-gray-400">
                                    <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
                                    <p>This booking does not contain any flights.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-blue-900/50 text-white p-6 rounded-lg text-center border border-blue-700">
                            <Clock size={48} className="mx-auto text-blue-400 mb-3" />
                            <p className="text-xl font-semibold">Booking Pending Approval</p>
                            <p>Your boarding pass(es) will be available here once the booking is approved.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-900 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}