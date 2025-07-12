import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Loader2, Plane, User, Calendar, Hash } from 'lucide-react';

export default function BookingStatementModal({ open, onClose, bookingId }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && bookingId) {
            setLoading(true);
            setError('');
            api.get(`/bookings/${bookingId}`)
                .then(res => setBooking(res.data))
                .catch(err => setError('Could not load booking details.'))
                .finally(() => setLoading(false));
        }
    }, [open, bookingId]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Booking Statement</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {loading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
                    {error && <p className="text-red-400">{error}</p>}
                    {booking && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-400">Booking ID</p>
                                    <p className="font-mono text-lg text-white">{booking.booking_id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Booked On</p>
                                    <p className="font-semibold text-white">{new Date(booking.booked_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 p-4 rounded-lg">
                                <h3 className="font-semibold text-cyan-400 mb-3">Booked Items</h3>
                                <div className="space-y-3">
                                    {booking.items.map(item => (
                                        <div key={item.bookable_item_id}>
                                            <p className="font-bold text-white">{item.title}</p>
                                            <p className="text-sm text-gray-400">{item.description}</p>
                                            <p className="text-right font-bold text-white">${parseFloat(item.price_at_booking).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-700 text-right">
                                    <p className="text-sm text-gray-400">Total Price</p>
                                    <p className="text-xl font-bold text-cyan-400">
                                        ${booking.items.reduce((sum, item) => sum + parseFloat(item.price_at_booking), 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
