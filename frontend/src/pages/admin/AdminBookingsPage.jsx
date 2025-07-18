import React, { useState, useEffect } from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import api from '../../services/api';
import {
    Eye, CheckCircle, XCircle, Trash2, PlaneTakeoff, Hotel,
    User, Loader2, X, Briefcase, Plane, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// --- Helper Functions ---
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'N/A';
const formatDuration = (min) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : 'N/A';


// --- Redesigned BoardingPass Component (Vibrant Dark Theme) ---
const BoardingPass = ({ segment, passenger, travelDate }) => {
    if (!segment) return null;
    return (
        <div className="vibrant-boarding-pass">
            <div className="pass-header">
                <h3 className="pass-title">BOARDING PASS</h3>
                <span className="pass-airline"><PlaneTakeoff size={20} /> {segment.airline}</span>
            </div>
            <div className="pass-route">
                <div>
                    <span className="route-iata">{segment.origin_iata}</span>
                    <span className="route-city">{segment.origin_name}</span>
                </div>
                <div className="route-plane">
                    <Plane size={28} />
                    <span>{formatDuration(segment.duration_minutes)}</span>
                </div>
                <div>
                    <span className="route-iata">{segment.destination_iata}</span>
                    <span className="route-city">{segment.destination_name}</span>
                </div>
            </div>
            <div className="pass-details">
                <div><span>PASSENGER</span><strong>{passenger.name?.toUpperCase()}</strong></div>
                <div><span>FLIGHT</span><strong>{segment.flight_number}</strong></div>
                <div><span>DATE</span><strong>{formatDate(travelDate)}</strong></div>
                <div><span>DEPARTS</span><strong>{formatTime(segment.departure_time)}</strong></div>
                <div><span>CLASS</span><strong>{segment.flight_class || 'ECONOMY'}</strong></div>
                <div><span>SEAT</span><strong>{segment.seat_number || 'N/A'}</strong></div>
                <div><span>GATE</span><strong>{segment.gate || 'N/A'}</strong></div>
                <div><span>TERMINAL</span><strong>{segment.terminal || 'N/A'}</strong></div>
            </div>
        </div>
    );
};


// --- Redesigned BookingDetailsModal Component (Vibrant Dark Theme) ---
const BookingDetailsModal = ({ isOpen, onClose, bookingId }) => {
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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-content" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="modal-close-btn"><X size={24} /></button>
                    {loading ? (
                        <div className="modal-loading"><Loader2 className="animate-spin text-orange-500" size={48} /></div>
                    ) : details && (
                        <>
                            <h2 className="modal-title">Booking Details</h2>
                            <div className="modal-scroll-area">
                                <div className="modal-section">
                                    <h3 className="section-title"><User size={20}/>Customer & Booking Info</h3>
                                    <p><strong>Username:</strong> {details.user_info.username}</p>
                                    <p><strong>Booking ID:</strong> {details.booking_id}</p>
                                    <p><strong>Status:</strong> <span className={`font-bold status-${details.status}`}>{details.status}</span></p>
                                </div>
                                <div className="modal-section">
                                    <h3 className="section-title"><Briefcase size={20}/>Booked Items</h3>
                                    {details.booked_items.map(item => (
                                        <div key={item.item_id} className="item-card">
                                            {item.type === 'flight' && <Plane size={18} />}
                                            {item.type === 'hotel' && <Hotel size={18} />}
                                            {item.type === 'activity' && <Activity size={18} />}
                                            <span>{item.title || `${item.flight_info.airline} ${item.flight_info.flight_number}`}</span>
                                        </div>
                                    ))}
                                </div>
                                {details.booked_items.filter(i => i.type === 'flight').map(flight => (
                                    <div key={flight.item_id} className="modal-section">
                                        <h3 className="section-title"><PlaneTakeoff size={20}/>Boarding Passes</h3>
                                        {flight.segments.map(segment => (
                                            <BoardingPass key={segment.segment_id} segment={segment} passenger={{ name: flight.passenger_name }} travelDate={details.travel_date} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
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
                await api.put(`/admin/bookings/${id}/status`, { status: type });
            }
            toast.success(`Booking ${type}d successfully!`);
            if (refresh) refresh();
        } catch (err) {
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
        <div className="vibrant-admin-page">
            <h1 className="page-title">Bookings Management</h1>
            <div className="tabs-container">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
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