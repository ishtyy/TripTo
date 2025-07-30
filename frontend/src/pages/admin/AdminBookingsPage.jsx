// src/pages/admin/AdminBookingsPage.jsx

import React, { useState, useEffect } from 'react';
import { DynamicDataTable } from '../../components/admin/DynamicDataTable';
import api from '../../services/api';
import {
    Eye, CheckCircle, XCircle, Trash2, PlaneTakeoff, Hotel,
    User, Loader2, X, Briefcase, Plane, Activity, Tag, DollarSign, CreditCard, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Modal from '../../components/common/Modal'; // Import the common Modal component

// --- Helper Functions ---
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'N/A';
const formatDuration = (min) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : 'N/A';
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
};


// --- Redesigned BoardingPass Component (Vibrant Dark Theme) ---
const BoardingPass = ({ segment, passenger, travelDate }) => {
    console.log('🎫 Rendering BoardingPass with:', { segment, passenger, travelDate });
    
    if (!segment || !segment.origin_iata || !segment.destination_iata) {
        console.warn('⚠️ BoardingPass: Missing essential segment data:', segment);
        return (
            <div className="bg-red-900/50 text-red-200 p-4 rounded border border-red-700 mt-4">
                <p className="text-sm">❌ Invalid segment data - missing required flight information</p>
                <pre className="text-xs mt-2 opacity-70">{JSON.stringify(segment, null, 2)}</pre>
            </div>
        );
    }
    
    return (
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 mt-4">
            <div className="flex justify-between items-center border-b border-dashed border-gray-600 pb-3 mb-4">
                <h3 className="font-extrabold text-2xl text-orange-500">BOARDING PASS</h3>
                <span className="flex items-center space-x-2 font-semibold"><PlaneTakeoff size={20} /> {segment.airline || 'Unknown Airline'}</span>
            </div>
            <div className="flex justify-between items-center text-center mb-4">
                <div>
                    <span className="text-4xl font-extrabold leading-none text-white">{segment.origin_iata}</span>
                    <span className="block text-sm text-gray-300">{segment.origin_name || 'Origin'}</span>
                </div>
                <div className="text-center text-gray-400 text-xs">
                    <Plane size={28} className="text-orange-500 mx-auto mb-1" />
                    <span>{formatDuration(segment.duration_minutes)}</span>
                </div>
                <div>
                    <span className="text-4xl font-extrabold leading-none text-white">{segment.destination_iata}</span>
                    <span className="block text-sm text-gray-300">{segment.destination_name || 'Destination'}</span>
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
                console.log('📋 Booking Details:', data);
                
                // Debug flight segments specifically
                if (data.booked_items) {
                    const flightItems = data.booked_items.filter(item => item.type === 'flight');
                    console.log('✈️ Flight Items:', flightItems);
                    
                    flightItems.forEach((item, idx) => {
                        console.log(`Flight ${idx + 1} (${item.title}):`, {
                            flight_info: item.flight_info,
                            flight_segments: item.flight_segments,
                            has_segments: item.flight_segments && item.flight_segments.length > 0
                        });
                    });
                }
                
                console.log(`📊 Booking Status: ${data.status}`);
                console.log(`🎫 Should show boarding passes: ${data.status === 'approved' && data.booked_items?.some(i => i.type === 'flight' && i.flight_segments && i.flight_segments.length > 0)}`);
                
                setDetails(data);
            } catch (err) {
                console.error("Failed to load booking details:", err);
                toast.error(err.response?.data?.message || "Failed to load booking details.");
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
                        {/* Customer & Booking Info */}
                        <div className="bg-gray-700 p-5 rounded-lg">
                            <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><User size={20}/>Customer & Booking Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <p><strong>Username:</strong> {details.user_info.username}</p>
                                <p><strong>Email:</strong> {details.user_info.email}</p>
                                <p><strong>Booking ID:</strong> <span className="font-mono text-sm">{details.booking_id}</span></p>
                                <p><strong>Status:</strong> <span className={`font-bold px-2 py-1 rounded text-sm ${
                                    details.status === 'approved' ? 'bg-green-600 text-white' :
                                    details.status === 'pending' ? 'bg-yellow-600 text-white' :
                                    details.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                                }`}>{details.status.toUpperCase()}</span></p>
                                <p><strong>Booked At:</strong> {formatDate(details.booked_at)} {formatTime(details.booked_at)}</p>
                                <p><strong>Travel Date:</strong> {formatDate(details.travel_date)}</p>
                            </div>
                        </div>

                        {/* Passenger Details */}
                        {details.passenger_details && details.passenger_details.length > 0 && (
                            <div className="bg-gray-700 p-5 rounded-lg">
                                <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><User size={20}/>Passenger Details</h3>
                                <div className="space-y-3">
                                    {details.passenger_details.map((passenger, index) => (
                                        <div key={passenger.passenger_detail_id || index} className="bg-gray-600 p-3 rounded-md">
                                            <p><strong>Name:</strong> {passenger.full_name}</p>
                                            <p><strong>Email:</strong> {passenger.email || 'N/A'}</p>
                                            <p><strong>Phone:</strong> {passenger.phone || 'N/A'}</p>
                                            <p><strong>DOB:</strong> {formatDate(passenger.date_of_birth) || 'N/A'}</p>
                                            <p><strong>Passport:</strong> {passenger.passport_number || 'N/A'}</p>
                                            <p><strong>Nationality:</strong> {passenger.nationality || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Booked Items Summary */}
                        {details.booked_items && details.booked_items.length > 0 && (
                            <div className="bg-gray-700 p-5 rounded-lg">
                                <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><Briefcase size={20}/>Booked Items</h3>
                                <div className="space-y-4">
                                    {details.booked_items.map((item, index) => (
                                        <div key={item.bookable_item_id || `booked-item-${index}`} className="bg-gray-600 p-3 rounded-md border border-gray-500">
                                            <div className="flex items-center space-x-3 mb-2 font-semibold text-white">
                                                {item.type === 'flight' && <Plane size={18} />}
                                                {item.type === 'accommodation' && <Hotel size={18} />}
                                                {item.type === 'activity' && <Activity size={18} />}
                                                {item.type === 'package' && <Briefcase size={18} />}
                                                <span>{item.title} ({item.type})</span>
                                            </div>
                                            <p className="text-sm"><strong>Description:</strong> {item.description}</p>
                                            <p className="text-sm"><strong>Quantity:</strong> {item.quantity}</p>
                                            <p className="text-sm"><strong>Price at Booking:</strong> {formatPrice(item.price_at_booking)}</p>

                                            {/* Type-specific details */}
                                            {item.type === 'package' && item.package_info && (
                                                <div className="mt-2 text-xs text-gray-300">
                                                    <p><strong>Destination:</strong> {item.package_info.destination_name}, {item.package_info.country}</p>
                                                    <p><strong>Dates:</strong> {formatDate(item.package_info.start_date)} - {formatDate(item.package_info.end_date)}</p>
                                                    <p><strong>Group Size:</strong> {item.package_info.group_size}</p>
                                                </div>
                                            )}
                                            {item.type === 'flight' && item.flight_info && (
                                                <div className="mt-2 text-xs text-gray-300 bg-blue-900/30 p-3 rounded">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <p><strong>Airline:</strong> {item.flight_info.airline} ({item.flight_info.flight_number})</p>
                                                        <p><strong>Duration:</strong> {formatDuration(item.flight_info.duration_minutes)}</p>
                                                        <p><strong>Route:</strong> {item.flight_info.origin_iata} ({item.flight_info.origin_name}) → {item.flight_info.destination_iata} ({item.flight_info.destination_name})</p>
                                                        <p><strong>Aircraft:</strong> Commercial Flight</p>
                                                        <p><strong>Departure:</strong> {formatDate(item.flight_info.departure_time)} at {formatTime(item.flight_info.departure_time)}</p>
                                                        <p><strong>Arrival:</strong> {formatDate(item.flight_info.arrival_time)} at {formatTime(item.flight_info.arrival_time)}</p>
                                                    </div>
                                                    {/* Show segment count if available */}
                                                    {item.flight_segments && item.flight_segments.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-blue-700">
                                                            <p><strong>Flight Segments:</strong> {item.flight_segments.length} segment(s)</p>
                                                            <p className="text-xs text-blue-300">Detailed boarding passes available below for approved bookings</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {item.type === 'accommodation' && item.accommodation_info && (
                                                <div className="mt-2 text-xs text-gray-300">
                                                    <p><strong>Hotel:</strong> {item.accommodation_info.hotel_name}</p>
                                                    <p><strong>Room Type:</strong> {item.accommodation_info.room_type}</p>
                                                    <p><strong>Location:</strong> {item.accommodation_info.location_name}</p>
                                                    <p><strong>Check-in:</strong> {formatDate(item.accommodation_info.check_in)}</p>
                                                    <p><strong>Check-out:</strong> {formatDate(item.accommodation_info.check_out)}</p>
                                                </div>
                                            )}
                                            {item.type === 'activity' && item.activity_info && (
                                                <div className="mt-2 text-xs text-gray-300">
                                                    <p><strong>Activity Name:</strong> {item.activity_info.activity_name}</p>
                                                    <p><strong>Type:</strong> {item.activity_info.activity_type}</p>
                                                    <p><strong>Location:</strong> {item.activity_info.location_name}</p>
                                                    <p><strong>Time:</strong> {formatTime(item.activity_info.start_time)} - {formatTime(item.activity_info.end_time)}</p>
                                                    <p><strong>Duration:</strong> {formatDuration(item.activity_info.duration_minutes)}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Boarding Passes (Only for Flight Items and Approved Bookings) */}
                        {details.booked_items && details.booked_items.some(i => i.type === 'flight' && i.flight_segments && i.flight_segments.length > 0) && details.status === 'approved' && (
                            <div className="bg-gray-700 p-5 rounded-lg">
                                <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><PlaneTakeoff size={20}/>Boarding Passes</h3>
                                <div className="space-y-4">
                                    {details.booked_items.filter(i => i.type === 'flight').map((flightItem, idx) => (
                                        <div key={`flight-item-${idx}`}>
                                            <h4 className="text-lg font-semibold text-white mb-2 border-b border-gray-600 pb-1">
                                                {flightItem.title} - {flightItem.flight_info?.flight_number}
                                            </h4>
                                            {flightItem.flight_segments && flightItem.flight_segments.length > 0 ? (
                                                flightItem.flight_segments.map((segment, segmentIndex) => (
                                                    <BoardingPass 
                                                        key={segment.segment_id || `flight-${idx}-segment-${segmentIndex}`} 
                                                        segment={segment} 
                                                        // Use the first passenger or default
                                                        passenger={{ name: details.passenger_details[0]?.full_name || 'Passenger' }} 
                                                        travelDate={details.travel_date} 
                                                    />
                                                ))
                                            ) : (
                                                <div className="bg-yellow-900/50 text-yellow-200 p-4 rounded border border-yellow-700">
                                                    <p className="text-sm">⚠️ No flight segments available for {flightItem.title}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message for non-approved bookings with flights */}
                        {details.booked_items && details.booked_items.some(i => i.type === 'flight') && details.status !== 'approved' && (
                            <div className="bg-blue-900/50 text-white p-6 rounded-lg text-center border border-blue-700">
                                <Clock size={48} className="mx-auto text-blue-400 mb-3" />
                                <p className="text-xl font-semibold">Booking Pending Approval</p>
                                <p>Boarding passes will be available once the booking is approved.</p>
                            </div>
                        )}

                        {/* Message for approved bookings with flights but no segments */}
                        {details.booked_items && details.booked_items.some(i => i.type === 'flight') && details.status === 'approved' && 
                         !details.booked_items.some(i => i.type === 'flight' && i.flight_segments && i.flight_segments.length > 0) && (
                            <div className="bg-yellow-900/50 text-white p-6 rounded-lg text-center border border-yellow-700">
                                <Plane size={48} className="mx-auto text-yellow-400 mb-3" />
                                <p className="text-xl font-semibold">Flight Segments Not Available</p>
                                <p className="text-sm mt-2">This booking contains flights but detailed flight segments are missing. Boarding passes cannot be generated.</p>
                                <p className="text-xs mt-2 text-yellow-300">Contact system administrator to create flight segments for this booking.</p>
                            </div>
                        )}

                        {/* Message when no flight bookings exist */}
                        {details.booked_items && !details.booked_items.some(i => i.type === 'flight') && (
                            <div className="bg-blue-900/50 text-white p-6 rounded-lg text-center border border-blue-700">
                                <Briefcase size={48} className="mx-auto text-blue-400 mb-3" />
                                <p className="text-xl font-semibold">No Flight Bookings</p>
                                <p className="text-sm mt-2">This booking does not contain any flight items. Boarding passes are only available for flight bookings.</p>
                            </div>
                        )}

                        {/* Invoice & Payments */}
                        {details.invoice_info && (
                            <div className="bg-gray-700 p-5 rounded-lg">
                                <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><DollarSign size={20}/>Invoice & Payments</h3>
                                <p><strong>Invoice ID:</strong> {details.invoice_info.invoice_id}</p>
                                <p><strong>Issued At:</strong> {formatDate(details.invoice_info.issued_at)}</p>
                                <p><strong>Status:</strong> {details.invoice_info.overall_status}</p>
                                <div className="mt-4 border-t border-gray-600 pt-4">
                                    <p><strong>Original Amount:</strong> {formatPrice(details.invoice_info.original_amount)}</p>
                                    <p><strong>Discount:</strong> {formatPrice(details.invoice_info.discount_amount)}</p>
                                    <p className="font-bold text-lg text-green-400">Total: {formatPrice(details.invoice_info.total_amount)}</p>
                                </div>

                                {details.invoice_info.items && details.invoice_info.items.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-gray-300 mb-2">Invoice Items</h4>
                                        <div className="space-y-2">
                                            {details.invoice_info.items.map((item, index) => (
                                                <div key={item.invoice_item_id || `invoice-item-${index}`} className="bg-gray-600 p-2 rounded-md">
                                                    <p className="text-sm">Item ID: {item.bookable_item_id}</p>
                                                    <p className="text-sm">Base: {formatPrice(item.base_price)}, Discount: {formatPrice(item.discount)}, Final: {formatPrice(item.final_price)}</p>
                                                    <p className="text-sm">Payment Status: {item.payment_status}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {details.payment_info && details.payment_info.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-gray-300 mb-2">Payment History</h4>
                                        <div className="space-y-2">
                                            {details.payment_info.map((payment, index) => (
                                                <div key={payment.payment_id || `payment-${index}`} className="bg-gray-600 p-2 rounded-md">
                                                    <p className="text-sm">Amount: {formatPrice(payment.amount)} ({payment.method})</p>
                                                    <p className="text-sm">Date: {formatDate(payment.payment_date)} {formatTime(payment.payment_date)}</p>
                                                    <p className="text-sm">Status: {payment.status}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Coupon Details */}
                        {details.coupon_info && (
                            <div className="bg-gray-700 p-5 rounded-lg">
                                <h3 className="text-xl font-semibold flex items-center space-x-2 mb-3 text-orange-400"><Tag size={20}/>Coupon Applied</h3>
                                <p><strong>Code:</strong> {details.coupon_info.coupon_code}</p>
                                <p><strong>Title:</strong> {details.coupon_info.title}</p>
                                <p><strong>Discount:</strong> {details.coupon_info.discount_value}% (Max {formatPrice(details.coupon_info.max_discount_amount)})</p>
                                <p><strong>Valid Until:</strong> {formatDate(details.coupon_info.valid_until)}</p>
                                <p><strong>Status:</strong> {details.coupon_info.status}</p>
                            </div>
                        )}

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
                // FIX: Changed to PATCH as per REST semantics
                await api.patch(`/admin/bookings/${id}/status`, { status }); 
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