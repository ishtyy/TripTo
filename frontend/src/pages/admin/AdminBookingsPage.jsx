// src/pages/admin/AdminBookingsPage.jsx

import React, { useState, useEffect } from 'react';
import { DynamicDataTable } from '../../components/admin/DynamicDataTable';
import api from '../../services/api';
import {
    Eye, CheckCircle, XCircle, Trash2, PlaneTakeoff, Hotel,
    User, Loader2, X, Briefcase, Plane, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Modal from '../../components/common/Modal'; // Import the common Modal component

// --- Helper Functions ---
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'N/A';
const formatDuration = (min) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : 'N/A';


// --- Redesigned BoardingPass Component (Vibrant Dark Theme) ---
const BoardingPass = ({ segment, passenger, travelDate }) => {
    if (!segment) return null;
    return (
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 mt-4">
            <div className="flex justify-between items-center border-b border-dashed border-gray-600 pb-3 mb-4">
                <h3 className="font-extrabold text-2xl text-orange-500">BOARDING PASS</h3>
                <span className="flex items-center space-x-2 font-semibold"><PlaneTakeoff size={20} /> {segment.airline}</span>
            </div>
            <div className="flex justify-between items-center text-center mb-4">
                <div>
                    <span className="text-4xl font-extrabold leading-none text-white">{segment.origin_iata}</span>
                    <span className="block text-sm text-gray-300">{segment.origin_name}</span>
                </div>
                <div className="text-center text-gray-400 text-xs">
                    <Plane size={28} className="text-orange-500 mx-auto mb-1" />
                    <span>{formatDuration(segment.duration_minutes)}</span>
                </div>
                <div>
                    <span className="text-4xl font-extrabold leading-none text-white">{segment.destination_iata}</span>
                    <span className="block text-sm text-gray-300">{segment.destination_name}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-dashed border-gray-600 pt-4 text-xs">
                <div className="flex flex-col"><span>PASSENGER</span><strong className="font-mono text-white">{passenger.name?.toUpperCase()}</strong></div>
                <div className="flex flex-col"><span>FLIGHT</span><strong className="font-mono text-white">{segment.flight_number}</strong></div>
                <div className="flex flex-col"><span>DATE</span><strong className="font-mono text-white">{formatDate(travelDate)}</strong></div>
                <div className="flex flex-col"><span>DEPARTS</span><strong className="font-mono text-white">{formatTime(segment.departure_time)}</strong></div>
                <div className="flex flex-col"><span>CLASS</span><strong className="font-mono text-white">{segment.flight_class || 'ECONOMY'}</strong></div>
                <div className="flex flex-col"><span>SEAT</span><strong className="font-mono text-white">{segment.seat_number || 'N/A'}</strong></div>
                <div className="flex flex-col"><span>GATE</span><strong className="font-mono text-white">{segment.gate || 'N/A'}</strong></div>
                <div className="flex flex-col"><span>TERMINAL</span><strong className="font-mono text-white">{segment.terminal || 'N/A'}</strong></div>
            </div>
        </div>
    );
};


// --- Refactored BookingDetailsModal Component to use common Modal ---
const BookingDetailsModal = ({ isOpen, onClose, bookingId, maxWidthClass }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !bookingId) return;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/admin/bookings/${bookingId}`);
                setDetails(data);
            } catch (err) {
                toast.error("Failed to load booking details.");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [isOpen, bookingId, onClose]);

    return (
        <Modal open={isOpen} onClose={onClose} maxWidthClass={maxWidthClass}>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-80"><Loader2 className="animate-spin text-orange-500" size={48} /></div>
            ) : details && (
                <div className="bg-gray-800 text-gray-200 rounded-xl flex flex-col max-h-[80vh] overflow-hidden border border-gray-700">
                    <h2 className="text-3xl font-bold p-6 border-b border-gray-700 text-orange-400">Booking Details</h2>
                    <div className="p-6 overflow-y-auto flex flex-col gap-6">
                        <div className="bg-gray-700 p-5 rounded-lg">
                            <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><User size={20}/>Customer & Booking Info</h3>
                            <p><strong>Username:</strong> {details.user_info.username}</p>
                            <p><strong>Booking ID:</strong> {details.booking_id}</p>
                            <p><strong>Status:</strong> <span className={`font-bold ${
                                details.status === 'approved' ? 'text-green-400' :
                                details.status === 'pending' ? 'text-yellow-400' :
                                details.status === 'cancelled' ? 'text-red-400' : ''
                            }`}>{details.status}</span></p>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-lg">
                            <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><Briefcase size={20}/>Booked Items</h3>
                            {details.booked_items.map(item => (
                                <div key={item.item_id} className="flex items-center space-x-3 bg-gray-600 p-2.5 rounded-md mb-2">
                                    {item.type === 'flight' && <Plane size={18} />}
                                    {item.type === 'hotel' && <Hotel size={18} />}
                                    {item.type === 'activity' && <Activity size={18} />}
                                    {item.type === 'package' && <Briefcase size={18} />}
                                    <span>{item.title || (item.flight_info ? `${item.flight_info.airline} ${item.flight_info.flight_number}` : 'Item')}</span>
                                </div>
                            ))}
                        </div>
                        {details.booked_items.filter(i => i.type === 'flight').map(flight => (
                            <div key={flight.item_id} className="bg-gray-700 p-5 rounded-lg">
                                <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><PlaneTakeoff size={20}/>Boarding Passes</h3>
                                {flight.segments && flight.segments.map(segment => (
                                    <BoardingPass key={segment.segment_id} segment={segment} passenger={{ name: flight.passenger_name }} travelDate={details.travel_date} />
                                ))}
                                {!flight.segments && (
                                    <p className="text-gray-400">No flight segments available</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
};


// --- Main AdminBookingsPage Component ---
export default function AdminBookingsPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [modalState, setModalState] = useState({ detailsOpen: false, confirmOpen: false, selectedId: null, action: null });

    const TABS = [
        { id: 'all', label: 'All Bookings', icon: Briefcase, endpoint: '/admin/bookings' },
        { id: 'flights', label: 'Flights', icon: Plane, endpoint: '/admin/bookings/flights' },
        { id: 'hotels', label: 'Hotels', icon: Hotel, endpoint: '/admin/bookings/hotels' },
    ];

    const handleAction = (type, id, refresh) => {
        setModalState({ ...modalState, confirmOpen: true, action: { type, id, refresh } });
    };
    
    const confirmAction = async () => {
        const { type, id, refresh } = modalState.action;
        if (!type || !id) return;

        try {
            if (type === 'delete') {
                await api.delete(`/admin/bookings/${id}`);
            } else {
                // Convert action type to proper status value
                const statusMap = {
                    'approve': 'approved',
                    'cancel': 'cancelled'
                };
                const status = statusMap[type] || type;
                await api.put(`/admin/bookings/${id}/status`, { status });
            }
            // Create proper message for toast
            const messageMap = {
                'approve': 'approved',
                'cancel': 'cancelled',
                'delete': 'deleted'
            };
            const statusMessage = messageMap[type] || `${type}d`;
            toast.success(`Booking ${statusMessage} successfully!`);
            if (refresh) refresh();
        } catch (err) {
            console.error('Action error:', err);
            toast.error(err.response?.data?.message || `Failed to ${type} booking.`);
        } finally {
            setModalState({ ...modalState, confirmOpen: false, action: null });
        }
    };

    const bookingColumns = [
        { header: 'Booking ID', accessor: 'booking_id' },
        { header: 'User', accessor: 'user_username' },
        { header: 'Status', accessor: 'status', type: 'status' },
    ];

    const bookingActions = [
        { label: 'View', icon: <Eye size={18} className="text-blue-400" />, action: (id) => setModalState({ ...modalState, detailsOpen: true, selectedId: id }) },
        { label: 'Approve', icon: <CheckCircle size={18} className="text-green-400" />, action: (id, r) => handleAction('approve', id, r), isVisible: row => row.status === 'pending' },
        { label: 'Cancel', icon: <XCircle size={18} className="text-yellow-400" />, action: (id, r) => handleAction('cancel', id, r), isVisible: row => row.status !== 'cancelled' },
        { label: 'Delete', icon: <Trash2 size={18} className="text-red-400" />, action: (id, r) => handleAction('delete', id, r) },
    ];

    return (
        <div className="p-8 animate-fadeIn">
            {/* Removed the redundant h1 tag */}
            <div className="flex space-x-2 mb-6 border-b-2 border-gray-700">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-3 font-semibold text-gray-400 border-b-3 border-transparent -mb-[2px] transition-all hover:text-gray-200 hover:border-orange-400 ${activeTab === tab.id ? 'text-orange-400 border-orange-400' : ''}`}>
                        <tab.icon size={18} /><span>{tab.label}</span>
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {TABS.map(tab => activeTab === tab.id && (
                    <DynamicDataTable
                        key={tab.id}
                        endpoint={tab.endpoint}
                        columns={bookingColumns}
                        itemKey="booking_id"
                        actions={bookingActions}
                    />
                ))}
            </div>
            <BookingDetailsModal
                isOpen={modalState.detailsOpen}
                onClose={() => setModalState({ ...modalState, detailsOpen: false })}
                bookingId={modalState.selectedId}
                maxWidthClass="max-w-4xl" // Added this prop
            />
            <ConfirmationModal
                isOpen={modalState.confirmOpen}
                onClose={() => setModalState({ ...modalState, confirmOpen: false })}
                onConfirm={confirmAction}
                title="Confirm Action"
                message={`Are you sure you want to ${modalState.action?.type} this booking?`}
            />
        </div>
    );
}