import React, { useState, useEffect } from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import api from '../../services/api';
import {
    Eye, CheckCircle, XCircle, Trash2, // Standard action icons
    PlaneTakeoff, Hotel, Activity, DollarSign, // Icons for booking item types
    User, Mail, Calendar, Plane, MapPin, Loader2, // General purpose icons
    X, // Icon for modal close button
    Briefcase // Icon for booking overview
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Helper to format date/time
const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true; // Use 12-hour format with AM/PM
    }
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// BookingDetailsModal component - Beautiful and engaging view
const BookingDetailsModal = ({ isOpen, onClose, bookingId }) => {
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

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl text-gray-800 flex flex-col items-center"> {/* Light theme */}
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={36} />
                    <p>Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl text-red-500 flex flex-col items-center text-center"> {/* Light theme */}
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
            case 'pending': return 'text-orange-500'; // More vibrant orange
            case 'approved': return 'text-green-600'; // Darker vibrant green
            case 'cancelled': return 'text-red-600'; // Darker vibrant red
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50 overflow-y-auto" // Added overflow-y-auto here
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        className="bg-white rounded-lg p-8 w-full max-w-4xl shadow-2xl relative text-gray-800 my-8 overflow-y-auto max-h-[90vh]" // Changed to light theme, added overflow-y-auto and max-h
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b border-gray-200 pb-3">Booking Details</h2>

                        {/* User & Booking Info */}
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
                                    <span className={`font-semibold ml-2 capitalize ${getStatusClass(status)}`}>
                                        {status || 'N/A'}
                                    </span>
                                </p>
                                <p><strong className="text-gray-600">Booked On:</strong> {formatDate(booked_at)}</p>
                                <p><strong className="text-gray-600">Travel Date:</strong> {formatDate(travel_date, false)}</p>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="mb-8 p-4 bg-blue-50/50 rounded-md border border-blue-100"> {/* Light themed box */}
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
                                    ) : (
                                        <p className="md:col-span-2 text-gray-600">No payment details found.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-600">No invoice or payment information available.</p>
                            )}
                        </div>

                        {/* Booked Items (categorized) */}
                        <div className="mb-8 p-4 bg-green-50/50 rounded-md border border-green-100"> {/* Light themed box */}
                            <h3 className="text-xl font-semibold text-green-700 mb-4 border-b border-green-200 pb-2 flex items-center"><Activity size={20} className="mr-2 text-teal-600" />Detailed Booked Items</h3>

                            {flightItems.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-lg font-medium text-green-600 mb-2 flex items-center"><Plane size={18} className="mr-2"/>Flights</h4>
                                    <ul className="space-y-2">
                                        {flightItems.map((item, index) => (
                                            <li key={item.item_id || `flight-${index}`} className="p-3 bg-green-100 rounded-md shadow-sm">
                                                <p className="font-semibold text-gray-800">{item.flight_info?.airline} {item.flight_info?.flight_number} - {item.flight_info?.origin_name} to {item.flight_info?.destination_name}</p>
                                                <p className="text-sm text-gray-600">Dep: {formatDate(item.flight_info?.departure_time)} | Arr: {formatDate(item.flight_info?.arrival_time)}</p>
                                                <p className="text-sm text-blue-600 font-semibold">${item.price?.toFixed(2)} x {item.quantity} ({item.flight_class || item.description || 'N/A'})</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {accommodationItems.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-lg font-medium text-green-600 mb-2 flex items-center"><Hotel size={18} className="mr-2"/>Accommodation</h4>
                                    <ul className="space-y-2">
                                        {accommodationItems.map((item, index) => (
                                            <li key={item.item_id || `acc-${index}`} className="p-3 bg-green-100 rounded-md shadow-sm">
                                                <p className="font-semibold text-gray-800">{item.title}</p>
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                                <p className="text-sm text-blue-600 font-semibold">${item.price?.toFixed(2)} x {item.quantity}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activityItems.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-lg font-medium text-green-600 mb-2 flex items-center"><Activity size={18} className="mr-2"/>Activities</h4>
                                    <ul className="space-y-2">
                                        {activityItems.map((item, index) => (
                                            <li key={item.item_id || `act-${index}`} className="p-3 bg-green-100 rounded-md shadow-sm">
                                                <p className="font-semibold text-gray-800">{item.title}</p>
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                                <p className="text-sm text-blue-600 font-semibold">${item.price?.toFixed(2)} x {item.quantity}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {booked_items.length === 0 && (
                                <p className="text-gray-600">No specific items found for this booking.</p>
                            )}
                        </div>


                        {/* Boarding Pass Mockup (only if flight exists) */}
                        {flightItems.length > 0 && flightItems[0].flight_info && (
                            <div className="bg-gradient-to-br from-blue-100 to-blue-300 p-6 rounded-lg shadow-xl border border-blue-400 relative overflow-hidden mb-8"> {/* Lighter background gradient */}
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                    <Plane size={150} className="text-blue-200 transform rotate-45 -translate-x-1/4 -translate-y-1/4" />
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed border-blue-400 pb-4 mb-4 relative z-10">
                                    <h3 className="text-2xl font-bold text-blue-800">BOARDING PASS</h3> {/* Darker text */}
                                    <span className="text-lg font-mono text-blue-700 flex items-center"> {/* Darker text */}
                                        <PlaneTakeoff size={20} className="mr-2 text-blue-600"/> {flightItems[0].flight_info.airline || 'Airline'}
                                    </span>
                                </div>

                                {/* From-To Section */}
                                <div className="flex items-center justify-between text-center mb-6 px-4">
                                    <div className="flex flex-col items-center">
                                        <MapPin size={24} className="text-blue-600 mb-1" />
                                        <span className="text-sm text-gray-600 font-semibold">FROM</span>
                                        <span className="text-3xl font-extrabold text-blue-800">{flightItems[0].flight_info.origin_name?.toUpperCase().substring(0, 3) || '???'}</span>
                                        <span className="text-sm text-gray-500">{flightItems[0].flight_info.origin_name || 'Origin City'}</span>
                                        <span className="text-sm text-gray-500">{formatDate(flightItems[0].flight_info.departure_time)}</span>
                                    </div>
                                    <Plane size={36} className="text-blue-500 mx-4 rotate-90 md:rotate-0" /> {/* Central Plane Icon */}
                                    <div className="flex flex-col items-center">
                                        <MapPin size={24} className="text-blue-600 mb-1" />
                                        <span className="text-sm text-gray-600 font-semibold">TO</span>
                                        <span className="text-3xl font-extrabold text-blue-800">{flightItems[0].flight_info.destination_name?.toUpperCase().substring(0, 3) || '???'}</span>
                                        <span className="text-sm text-gray-500">{flightItems[0].flight_info.destination_name || 'Destination City'}</span>
                                        <span className="text-sm text-gray-500">{formatDate(flightItems[0].flight_info.arrival_time)}</span>
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-700 relative z-10 font-mono">
                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">PASSENGER NAME</span>
                                        <span className="text-base font-semibold">{user_info?.username?.toUpperCase() || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">FLIGHT</span>
                                        <span className="text-base font-semibold">{flightItems[0].flight_info.flight_number || 'N/A'}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">DATE</span>
                                        <span className="text-base font-semibold">{formatDate(travel_date, false)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">CLASS</span>
                                        <span className="text-base font-semibold">{flightItems[0].flight_class || flightItems[0].description || 'Economy'}</span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">SEAT</span>
                                        <span className="text-base font-semibold">{flightItems[0].seat_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">GATE</span>
                                        <span className="text-base font-semibold">{flightItems[0].gate || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-blue-500 text-xs mb-1">TERMINAL</span>
                                        <span className="text-base font-semibold">{flightItems[0].terminal || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Barcode Placeholder */}
                                <div className="mt-8 flex justify-center items-center">
                                    <div className="w-2/3 h-16 bg-gray-200 flex justify-center items-center rounded-md">
                                        <span className="font-mono text-gray-500 text-sm">BARCODE MOCKUP</span>
                                    </div>
                                </div>

                                <p className="col-span-2 text-center mt-4 text-xs font-mono text-gray-500">
                                    BOOKING ID: {booking_id}
                                </p>
                            </div>
                        )}


                        {/* Modal Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


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
    const [bookingIdToActOn, setBookingIdToActOn] = useState(null); // Stores just the ID

    // Function to open the details modal
    const openViewDetailsModal = (bookingId) => { // Expects just the ID now
        setSelectedBookingId(bookingId);
        setIsDetailsModalOpen(true);
    };

    // Function to initiate an action that requires confirmation
    const handleActionConfirmation = (actionType, bookingId, refreshData) => { // Expects just the ID now
        setActionToConfirm({ type: actionType, refreshData });
        setBookingIdToActOn(bookingId); // Store just the ID
        setIsConfirmModalOpen(true);
    };

    // Function to perform the confirmed action
    const confirmAction = async () => {
        setIsConfirmModalOpen(false); // Close confirmation modal immediately

        if (!bookingIdToActOn || !actionToConfirm) {
            toast.error("Action data missing. Please try again.");
            console.error("Confirmation action triggered without valid booking or action data.");
            return;
        }

        const { type, refreshData } = actionToConfirm;
        const bookingId = bookingIdToActOn; // Use the stored ID directly

        if (!bookingId) {
            toast.error("Booking ID is missing for this action.");
            console.error(`Attempted to perform ${type} action with undefined bookingId:`, bookingIdToActOn);
            return;
        }

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
            refreshData(); // Refresh the table after successful action
        } catch (error) {
            console.error(`Failed to perform ${type} action:`, error);
            // Only show toast error if it's an actual error, not a success message from a 500 status
            // Check if there's a response and a message, and if the message isn't a success one
            if (error.response?.data?.message && !error.response.data.message.toLowerCase().includes('success')) {
                toast.error(error.response?.data?.message);
            } else {
                toast.error(`Failed to ${type} booking.`);
            }
        } finally {
            // Reset state regardless of success or failure
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
                    {
                        label: 'View Details',
                        action: (rowId, refresh) => openViewDetailsModal(rowId),
                        icon: <Eye size={18} className="text-blue-400"/>
                    },
                    {
                        label: 'Approve',
                        action: (rowId, refresh) => handleActionConfirmation('approve', rowId, refresh),
                        icon: <CheckCircle size={18} className="text-green-400"/>,
                        isVisible: (row) => row.status === 'pending'
                    },
                    {
                        label: 'Cancel',
                        action: (rowId, refresh) => handleActionConfirmation('cancel', rowId, refresh),
                        icon: <XCircle size={18} className="text-red-400"/>,
                        isVisible: (row) => row.status === 'pending' || row.status === 'approved'
                    },
                    {
                        label: 'Delete Booking',
                        action: (rowId, refresh) => handleActionConfirmation('delete', rowId, refresh),
                        icon: <Trash2 size={18} className="text-red-400"/>
                    },
                ]}
            />
            {/* Booking Details Modal */}
            <BookingDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                bookingId={selectedBookingId}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAction}
                title={actionToConfirm?.type === 'delete' ? 'Confirm Deletion' : `Confirm ${actionToConfirm?.type === 'approve' ? 'Approval' : 'Cancellation'}`}
                message={actionToConfirm?.type === 'delete' ? `Are you sure you want to delete booking ${bookingIdToActOn}? This action cannot be undone.` :
                         `Are you sure you want to ${actionToConfirm?.type} booking ${bookingIdToActOn}?`}
                confirmText={actionToConfirm?.type === 'delete' ? 'Delete' : actionToConfirm?.type === 'approve' ? 'Approve' : 'Cancel'}
                type={actionToConfirm?.type === 'delete' ? 'danger' : 'info'}
            />
        </div>
    );
}