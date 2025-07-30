import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Package, Hotel, Plane, Trash2, ShoppingCart, Calendar, DollarSign } from 'lucide-react';

const CartItem = ({ item, onRemove }) => {
    const getItemIcon = (type) => {
        switch (type) {
            case 'flight':
                return <Plane size={20} className="text-blue-400" />;
            case 'hotel':
                return <Hotel size={20} className="text-green-400" />;
            case 'package':
                return <Package size={20} className="text-purple-400" />;
            default:
                return <Package size={20} className="text-gray-400" />;
        }
    };

    const getItemDetails = (item) => {
        // Ensure price is always a number
        const safePrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
        
        switch (item.type) {
            case 'flight':
                return {
                    title: item.title || 'Flight',
                    subtitle: item.subtitle || '',
                    dates: item.dates?.departure_time && item.dates?.arrival_time 
                        ? `${new Date(item.dates.departure_time).toLocaleDateString()} - ${new Date(item.dates.arrival_time).toLocaleDateString()}`
                        : 'Dates not available',
                    price: safePrice
                };
            case 'hotel':
                return {
                    title: item.title || 'Hotel',
                    subtitle: item.subtitle || '',
                    dates: item.dates?.check_in && item.dates?.check_out
                        ? `${new Date(item.dates.check_in).toLocaleDateString()} - ${new Date(item.dates.check_out).toLocaleDateString()}`
                        : 'Dates not available',
                    price: safePrice
                };
            case 'package':
                return {
                    title: item.title || 'Package',
                    subtitle: item.subtitle || '',
                    dates: item.dates?.start_date && item.dates?.end_date
                        ? `${new Date(item.dates.start_date).toLocaleDateString()} - ${new Date(item.dates.end_date).toLocaleDateString()}`
                        : 'Dates not available',
                    price: safePrice
                };
            default:
                return {
                    title: 'Unknown Item',
                    subtitle: '',
                    dates: '',
                    price: 0
                };
        }
    };

    const details = getItemDetails(item);

    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-700 rounded-lg">
                    {getItemIcon(item.type)}
                </div>
                <div>
                    <p className="font-semibold text-white">{details.title}</p>
                    <p className="text-sm text-gray-400">{details.subtitle}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>{details.dates}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-purple-400 font-semibold">${details.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                </div>
                <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-400 hover:text-red-500 transition-colors p-2 rounded-full"
                    title="Remove from cart"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};

export default function UnifiedBookingCart() {
    const { cartItems, removeFromCart, proceedTo } = useBooking();

    // Fix: Ensure totalPrice is always a number
    const totalPrice = cartItems.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
        return sum + price;
    }, 0);

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingCart size={24} />
                Your Cart ({cartItems.length})
            </h2>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {cartItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Your cart is empty</p>
                        <p className="text-sm">Add flights, hotels, or packages to get started</p>
                    </div>
                ) : (
                    cartItems.map((item) => (
                        <CartItem 
                            key={item.id} 
                            item={item} 
                            onRemove={removeFromCart}
                        />
                    ))
                )}
            </div>
            
            {cartItems.length > 0 && (
                <>
                    <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Total:</span>
                            <span className="text-2xl font-bold text-purple-400 flex items-center gap-1">
                                <DollarSign size={20} />
                                {totalPrice.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => proceedTo('details')}
                        className="w-full px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Proceed to Booking Details
                    </button>
                </>
            )}
        </div>
    );
}