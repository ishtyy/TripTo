import React, { useState, useEffect } from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import api from '../../services/api';
import {
    Eye, CheckCircle, XCircle, Trash2,
    PlaneTakeoff, Hotel, Activity, DollarSign,
    User, Mail, Calendar, Plane, MapPin, Loader2,
    X, Briefcase, Clock, Users, ArrowRightCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Helper functions (formatDate, formatTime, formatDuration) remain the same...
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


// NEW: Dedicated BoardingPass component for clarity and reuse.
const BoardingPass = ({ segment, flight, passenger, travelDate }) => {
    if (!segment) return null;

    return (
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-lg shadow-xl border border-blue-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <Plane size={150} className="text-blue-300 transform rotate-45 -translate-x-1/4 -translate-y-1/4" />
            </div>
            <div className="flex justify-between items-center border-b border-dashed border-blue-400 pb-4 mb-4 relative z-10">
                <h3 className="text-2xl font-bold text-blue-800">BOARDING PASS</h3>
                <span className="text-lg font-mono text-blue-700 flex items-center">
                    <PlaneTakeoff size={20} className="mr-2 text-blue-600"/> {segment.airline || 'Airline'}
                </span>
            </div>

            <div className="flex items-center justify-between text-center mb-6 px-4">
                <div className="flex flex-col items-center">
                    <MapPin size={24} className="text-blue-600 mb-1" />
                    <span className="text-sm text-gray-600 font-semibold">FROM</span>
                    <span className="text-3xl font-extrabold text-blue-800">{segment.origin_iata || '???'}</span>
                    <span className="text-sm text-gray-500">{segment.origin_name || 'Origin City'}</span>
                </div>
                <div className="flex flex-col items-center">
                    <Plane size={36} className="text-blue-500 mx-4" />
                    <span className="text-xs text-gray-500">{formatDuration(segment.duration_minutes)}</span>
                </div>
                <div className="flex flex-col items-center">
                    <MapPin size={24} className="text-blue-600 mb-1" />
                    <span className="text-sm text-gray-600 font-semibold">TO</span>
                    <span className="text-3xl font-extrabold text-blue-800">{segment.destination_iata || '???'}</span>
                    <span className="text-sm text-gray-500">{segment.destination_name || 'Destination City'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm text-gray-700 relative z-10 font-mono mt-6 pt-4 border-t border-dashed border-blue-400">
                <div><span className="text-blue-500 text-xs block">PASSENGER</span><span className="font-semibold">{passenger.name?.toUpperCase() || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">FLIGHT</span><span className="font-semibold">{segment.flight_number || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">DATE</span><span className="font-semibold">{formatDate(travelDate, false)}</span></div>
                <div><span className="text-blue-500 text-xs block">DEPARTS</span><span className="font-semibold">{formatTime(segment.departure_time)}</span></div>
                <div><span className="text-blue-500 text-xs block">CLASS</span><span className="font-semibold">{segment.flight_class || 'ECONOMY'}</span></div>
                <div><span className="text-blue-500 text-xs block">SEAT</span><span className="font-semibold">{segment.seat_number || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">GATE</span><span className="font-semibold">{segment.gate || 'N/A'}</span></div>
                <div><span className="text-blue-500 text-xs block">TERMINAL</span><span className="font-semibold">{segment.terminal || 'N/A'}</span></div>
            </div>

            <p className="text-center mt-6 text-xs font-mono text-gray-500">SEGMENT ID: {segment.segment_id}</p>
        </div>
    );
};


const BookingDetailsModal = ({ isOpen, onClose, bookingId }) => {
    // ... useEffect for fetching data remains the same ...
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !bookingId) {
            setBookingDetails(null);
            setError(null);
            return;
        }

        const fetchBookingDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/admin/bookings/${bookingId}`);
                setBookingDetails(response.data);
            } catch (err) {
                console.error("Failed to fetch full booking details:", err);
                const errorMessage = err.response?.data?.message || "Failed to load booking details. Please check server logs.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [isOpen, bookingId]);

    if (!isOpen) return null;
    
    // ... loading and error states remain the same ...
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl text-gray-800 flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={36} />
                    <p>Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl text-red-500 flex flex-col items-center text-center">
                    <p className="mb-4">Error: {error}</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
                </div>
            </div>
        );
    }
    
    if (!bookingDetails) return null;

    const { booking_id, booked_at, travel_date, status, user_info, booked_items, invoice_info } = bookingDetails;
    const payment = invoice_info?.payments?.[0];

    const getStatusClass = (currentStatus) => {
        switch (currentStatus) {
            case 'pending': return 'text-orange-500';
            case 'approved': return 'text-green-600';
            case 'cancelled': return 'text-red-600';
            default: return 'text-gray-500';
        }
    };

    const flightItems = booked_items?.filter(item => item.type === 'flight') || [];
    const accommodationItems = booked_items?.filter(item => item.type === 'accommodation') || [];
    const activityItems = booked_items?.filter(item => item.type === 'activity') || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
                        className="bg-white rounded-lg p-8 w-full max-w-4xl shadow-2xl relative text-gray-800 my-8 overflow-y-auto max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors">
                            <X size={24} />
                        </button>

                        <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b border-gray-200 pb-3">Booking Details</h2>

                        {/* User, Booking, and Payment Info sections remain the same... */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mb-8 text-gray-700">
                            <div>
                                <h3 className="text-xl font-semibold mb-3 text-blue-600 flex items-center"><User size={20} className="mr-2 text-blue-500" />User Information</h3>
                                <p><strong className="text-gray-600">Username:</strong> {user_info?.username || 'N/A'}</p>
                                <p><strong className="text-gray-600">Email:</strong> {user_info?.email || 'N/A'}</p>
                                <p><strong className="text-gray-600">User ID:</strong> <span className="break-all text-sm">{user_info?.user_id || 'N/A'}</span></p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3 text-blue-600 flex items-center"><Briefcase size={20} className="mr-2 text-purple-500" />Booking Overview</h3>
                                <p><strong className="text-gray-600">Booking ID:</strong> <span className="break-all text-sm">{booking_id}</span></p>
                                <p><strong className="text-gray-600">Status:</strong>
                                    <span className={`font-semibold ml-2 capitalize ${getStatusClass(status)}`}>{status || 'N/A'}</span>
                                </p>
                                <p><strong className="text-gray-600">Booked On:</strong> {formatDate(booked_at)}</p>
                                <p><strong className="text-gray-600">Travel Date:</strong> {formatDate(travel_date, false)}</p>
                            </div>
                        </div>
                        <div className="mb-8 p-4 bg-blue-50/50 rounded-md border border-blue-100">
                             <h3 className="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2 flex items-center"><DollarSign size={20} className="mr-2 text-green-600" />Payment Information</h3>
                            {invoice_info && invoice_info.invoice_id ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-gray-700">
                                    <p><strong className="text-gray-600">Invoice ID:</strong> <span className="break-all text-sm">{invoice_info.invoice_id || 'N/A'}</span></p>
                                    <p><strong className="text-gray-600">Invoice Status:</strong> <span className="capitalize">{invoice_info.overall_status || 'N/A'}</span></p>
                                    <p><strong className="text-gray-600">Issued At:</strong> {formatDate(invoice_info.issued_at)}</p>
                                    {payment ? (
                                        <>
                                            <p><strong className="text-gray-600">Payment Amount:</strong> <span className="text-green-700 font-bold">${payment.amount?.toFixed(2) || 'N/A'}</span></p>
                                            <p><strong className="text-gray-600">Payment Method:</strong> {payment.method || 'N/A'}</p>
                                            <p><strong className="text-gray-600">Payment Date:</strong> {formatDate(payment.payment_date)}</p>
                                            <p><strong className="text-gray-600">Payment Status:</strong> <span className="capitalize">{payment.status || 'N/A'}</span></p>
                                        </>
                                    ) : <p className="md:col-span-2 text-gray-600">No payment details found.</p>}
                                </div>
                            ) : <p className="text-gray-600">No invoice or payment information available.</p>}
                        </div>


                        {/* Booked Items (Summary) */}
                        <div className="mb-8">
                             <h3 className="text-xl font-semibold text-green-700 mb-4 border-b border-gray-200 pb-2 flex items-center"><Briefcase size={20} className="mr-2 text-green-600" />Booked Items Summary</h3>
                            <div className="space-y-3">
                                {flightItems.map((item, index) => <div key={item.item_id || index} className="p-3 bg-gray-50 rounded-md shadow-sm"><strong>Flight:</strong> {item.flight_info?.airline} {item.flight_info?.flight_number} for {item.passenger_name || user_info?.username}</div>)}
                                {accommodationItems.map((item, index) => <div key={item.item_id || index} className="p-3 bg-gray-50 rounded-md shadow-sm"><strong>Hotel:</strong> {item.title}</div>)}
                                {activityItems.map((item, index) => <div key={item.item_id || index} className="p-3 bg-gray-50 rounded-md shadow-sm"><strong>Activity:</strong> {item.title}</div>)}
                                {booked_items.length === 0 && <p>No items in this booking.</p>}
                            </div>
                        </div>
                        
                        {/* CHANGED: Render a list of boarding passes, one for each segment */}
                        {flightItems.map((flight, index) => (
                            <div key={flight.item_id || index} className="space-y-6">
                                {Array.isArray(flight.segments) && flight.segments.map(segment => (
                                    <BoardingPass
                                        key={segment.segment_id}
                                        segment={segment}
                                        flight={flight}
                                        passenger={{ name: flight.passenger_name || user_info?.username, gender: flight.passenger_gender, type: flight.passenger_type }}
                                        travelDate={travel_date}
                                    />
                                ))}
                            </div>
                        ))}

                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                            <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// The rest of the AdminBookingsPage component (columns, main function, etc.) remains unchanged.
const bookingColumns = [
    { header: 'Booking ID', accessor: 'booking_id', sortable: false },
    { header: 'User Name', accessor: 'user_username', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true },
    { header: 'Booked On', accessor: 'booked_at', type: 'date', sortable: true },
    { header: 'Travel Date', accessor: 'travel_date', type: 'date', sortable: true },
];

export default function AdminBookingsPage() {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);
    const [bookingIdToActOn, setBookingIdToActOn] = useState(null);

    const openViewDetailsModal = (bookingId) => {
        setSelectedBookingId(bookingId);
        setIsDetailsModalOpen(true);
    };

    const handleActionConfirmation = (actionType, bookingId, refreshData) => {
        setActionToConfirm({ type: actionType, refreshData });
        setBookingIdToActOn(bookingId);
        setIsConfirmModalOpen(true);
    };

    const confirmAction = async () => {
        setIsConfirmModalOpen(false);

        if (!bookingIdToActOn || !actionToConfirm) {
            toast.error("Action data missing. Please try again.");
            return;
        }

        const { type, refreshData } = actionToConfirm;
        const bookingId = bookingIdToActOn;

        try {
            if (type === 'delete') {
                await api.delete(`/admin/bookings/${bookingId}`);
                toast.success('Booking deleted successfully!');
            } else if (type === 'approve') {
                await api.put(`/admin/bookings/${bookingId}/status`, { status: 'approved' });
                toast.success('Booking approved successfully!');
            } else if (type === 'cancel') {
                await api.put(`/admin/bookings/${bookingId}/status`, { status: 'cancelled' });
                toast.success('Booking cancelled successfully!');
            }
            refreshData();
        } catch (error) {
            console.error(`Failed to perform ${type} action:`, error);
            const errorMessage = error.response?.data?.message || `Failed to ${type} booking.`;
            toast.error(errorMessage);
        } finally {
            setActionToConfirm(null);
            setBookingIdToActOn(null);
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-white mb-6">Booking Management</h1>
            <DynamicDataTable
                endpoint="/admin/bookings"
                columns={bookingColumns}
                searchPlaceholder="Search by Booking ID, Username or Status..."
                itemKey="booking_id"
                actions={[
                    { label: 'View Details', action: (rowId) => openViewDetailsModal(rowId), icon: <Eye size={18} className="text-blue-400"/> },
                    { label: 'Approve', action: (rowId, refresh) => handleActionConfirmation('approve', rowId, refresh), icon: <CheckCircle size={18} className="text-green-400"/>, isVisible: (row) => row.status === 'pending' },
                    { label: 'Cancel', action: (rowId, refresh) => handleActionConfirmation('cancel', rowId, refresh), icon: <XCircle size={18} className="text-red-400"/>, isVisible: (row) => row.status === 'pending' || row.status === 'approved' },
                    { label: 'Delete', action: (rowId, refresh) => handleActionConfirmation('delete', rowId, refresh), icon: <Trash2 size={18} className="text-red-400"/> },
                ]}
            />
            <BookingDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                bookingId={selectedBookingId}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAction}
                title={`Confirm ${actionToConfirm?.type || 'Action'}`}
                message={`Are you sure you want to ${actionToConfirm?.type} booking ${bookingIdToActOn}?`}
                confirmText={actionToConfirm?.type ? actionToConfirm.type.charAt(0).toUpperCase() + actionToConfirm.type.slice(1) : 'Confirm'}
                type={actionToConfirm?.type === 'delete' ? 'danger' : 'info'}
            />
        </div>
    );
}