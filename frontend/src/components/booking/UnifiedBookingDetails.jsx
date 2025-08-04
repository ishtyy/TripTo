import React, { useState } from 'react';
import { Users, ShoppingCart } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import PassengerAndSeatForm from './PassengerAndSeatForm';

export default function UnifiedBookingDetails() {
    const { cartItems, proceedTo } = useBooking();
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [completedItems, setCompletedItems] = useState(new Set());

    const currentItem = cartItems[currentItemIndex];

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-400">No items in cart to process</p>
            </div>
        );
    }

    const handleItemCompleted = (itemId) => {
        const newCompleted = new Set(completedItems);
        newCompleted.add(itemId);
        setCompletedItems(newCompleted);

        // Move to next item or proceed to review
        if (currentItemIndex < cartItems.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            // All items completed, proceed to review
            proceedTo('review');
        }
    };

    const handleSkipToNext = () => {
        if (currentItemIndex < cartItems.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            proceedTo('review');
        }
    };

    const renderDetailsForm = () => {
    if (!currentItem) return null;

    switch (currentItem.type) {
        case 'flight':
            return (
                <FlightDetailsForm 
                    item={currentItem}
                    onCompleted={() => handleItemCompleted(currentItem.id)}
                    onSkip={handleSkipToNext}
                />
            );
        case 'hotel':
            return (
                <HotelDetailsForm 
                    item={currentItem}
                    onCompleted={() => handleItemCompleted(currentItem.id)}
                    onSkip={handleSkipToNext}
                />
            );
        case 'package':
            // Check if it's a cart-only item or requires full booking details
            if (currentItem.data?.isCartOnly) {
                return (
                    <SimplePackageCartForm 
                        item={currentItem}
                        onCompleted={() => handleItemCompleted(currentItem.id)}
                        onSkip={handleSkipToNext}
                    />
                );
            } else {
                return (
                    <PackageDetailsForm 
                        item={currentItem}
                        onCompleted={() => handleItemCompleted(currentItem.id)}
                        onSkip={handleSkipToNext}
                    />
                );
            }
        default:
            return <div className="text-red-400">Unknown item type: {currentItem.type}</div>;
    }
};
    return (
        <div className="space-y-6">
            {/* Progress indicator */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">Booking Details Progress</h3>
                    <span className="text-sm text-gray-400">
                        {currentItemIndex + 1} of {cartItems.length}
                    </span>
                </div>
                
                <div className="flex gap-2 mb-4">
                    {cartItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`flex-1 h-2 rounded-full ${
                                index < currentItemIndex ? 'bg-green-500' :
                                index === currentItemIndex ? 'bg-cyan-500' :
                                'bg-gray-600'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <span className={`w-4 h-4 rounded-full ${
                        currentItem.type === 'flight' ? 'bg-cyan-500' :
                        currentItem.type === 'hotel' ? 'bg-blue-500' :
                        'bg-purple-500'
                    }`}></span>
                    <span className="text-gray-300 capitalize">{currentItem.type}:</span>
                    <span className="text-white font-medium">{currentItem.title}</span>
                </div>
            </div>

            {/* Current item details form */}
            {renderDetailsForm()}
        </div>
    );
}

// Flight details component (wrapper for existing PassengerAndSeatForm)
const FlightDetailsForm = ({ item, onCompleted, onSkip }) => {
    const { addPassengerAndSeatInfo } = useBooking();
    
    // Convert the cart item back to the flight format expected by PassengerAndSeatForm
    const flightForForm = {
        ...item.data,
        id: item.id
    };

    const handlePassengerInfo = (flightId, passengerData, seatNumber) => {
        addPassengerAndSeatInfo(flightId, passengerData, seatNumber);
        onCompleted();
    };

    return (
        <div className="space-y-4">
            <PassengerAndSeatForm 
                flight={flightForForm} 
                onSubmit={handlePassengerInfo}
            />
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onSkip}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Skip for Now
                </button>
            </div>
        </div>
    );
};

// Hotel details component
const HotelDetailsForm = ({ item, onCompleted, onSkip }) => {
    const [specialRequests, setSpecialRequests] = useState('');
    const [contactInfo, setContactInfo] = useState({
        phone: '',
        email: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save hotel-specific details to context or state
        console.log('Hotel details saved:', { specialRequests, contactInfo });
        onCompleted();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-4">Hotel Booking Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="Your phone number"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="Your email address"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Special Requests (Optional)
                    </label>
                    <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="Any special requests for your stay..."
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onSkip}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Skip for Now
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                    Save Hotel Details
                </button>
            </div>
        </form>
    );
};

// Package details component
const PackageDetailsForm = ({ item, onCompleted, onSkip }) => {
    const [groupSize, setGroupSize] = useState(1);
    const [dietaryRequirements, setDietaryRequirements] = useState('');
    const [emergencyContact, setEmergencyContact] = useState({
        name: '',
        phone: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save package-specific details to context or state
        console.log('Package details saved:', { groupSize, dietaryRequirements, emergencyContact });
        onCompleted();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-4">Package Booking Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Group Size
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={groupSize}
                            onChange={(e) => setGroupSize(parseInt(e.target.value))}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Emergency Contact Name
                        </label>
                        <input
                            type="text"
                            value={emergencyContact.name}
                            onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="Emergency contact name"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Emergency Contact Phone
                    </label>
                    <input
                        type="tel"
                        value={emergencyContact.phone}
                        onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="Emergency contact phone"
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dietary Requirements (Optional)
                    </label>
                    <textarea
                        value={dietaryRequirements}
                        onChange={(e) => setDietaryRequirements(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="Any dietary restrictions or requirements..."
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onSkip}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Skip for Now
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                    Save Package Details
                </button>
            </div>
        </form>
    );
};

// Simple cart form for packages added via "Add to Cart"
const SimplePackageCartForm = ({ item, onCompleted, onSkip }) => {
    const packageData = item.data;
    const groupSize = packageData.group_size || 1;

    const handleProceed = () => {
        console.log('Package cart item confirmed:', packageData);
        onCompleted();
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-purple-400" />
                    Package Cart Item
                </h4>
                
                {/* Package summary */}
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-4">
                    <h5 className="font-medium text-white mb-2">{packageData.package_name}</h5>
                    <p className="text-gray-300 text-sm mb-3">{packageData.destination}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Group Size:</span>
                            <div className="flex items-center gap-1 text-green-400 font-medium">
                                <Users size={14} />
                                {groupSize} {groupSize === 1 ? 'person' : 'people'}
                            </div>
                        </div>
                        <div>
                            <span className="text-gray-400">Total Cost:</span>
                            <div className="text-green-400 font-bold">
                                ${(packageData.unit_price * groupSize).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                    <p className="text-blue-300 text-sm">
                        ℹ️ This package is ready for booking. Passenger details will be collected during the payment process.
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onSkip}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    Skip for Now
                </button>
                <button
                    onClick={handleProceed}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                    Proceed to Review
                </button>
            </div>
        </div>
    );
};