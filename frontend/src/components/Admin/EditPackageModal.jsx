import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Plane, Hotel, Activity, Calendar, Users, DollarSign, Plus, Minus, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import MapPicker from '../common/MapPicker';

const EditPackageModal = ({ isOpen, onClose, onPackageUpdated, packageId }) => {
    console.log('EditPackageModal rendered with props:', { isOpen, packageId });
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [existingCoupons, setExistingCoupons] = useState([]);
    const [packageData, setPackageData] = useState({
        // Basic Info
        title: '',
        description: '',
        destination: null,
        startDate: '',
        endDate: '',
        groupSize: 1,
        
        // Components
        hotels: [],
        activities: [],
        
        // Flight Discount Coupon Settings
        flightDiscountEnabled: true,
        flightDiscountPercent: 25,
        flightDiscountMaxAmount: 200,
        flightDiscountValidityDays: 90,
        
        // Pricing
        basePrice: '',
        discountPercent: '',
        finalPrice: '',
        
        // Availability
        totalSlots: '',
        availableUntil: ''
    });

    // Load package data when modal opens
    useEffect(() => {
        console.log('EditPackageModal useEffect triggered:', { isOpen, packageId });
        if (isOpen && packageId) {
            loadPackageData();
        }
    }, [isOpen, packageId]);

    const loadPackageData = async () => {
        console.log('Loading package data for package ID:', packageId);
        try {
            setLoading(true);
            const response = await api.get(`/admin/packages/${packageId}/details`);
            console.log('Package data loaded:', response.data);
            const pkg = response.data;
            
            // Transform the data to match our form structure
            setPackageData({
                title: pkg.title || '',
                description: pkg.description || '',
                destination: pkg.destination ? {
                    id: pkg.destination.location_id,
                    name: pkg.destination.location_name,
                    latitude: pkg.destination.latitude,
                    longitude: pkg.destination.longitude,
                    country: pkg.destination.country,
                    address: {
                        cityName: pkg.destination.location_name,
                        countryName: pkg.destination.country
                    }
                } : null,
                startDate: pkg.start_date ? pkg.start_date.split('T')[0] : '',
                endDate: pkg.end_date ? pkg.end_date.split('T')[0] : '',
                groupSize: pkg.group_size || 1,
                hotels: pkg.hotels || [],
                activities: pkg.activities || [],
                // Flight discount settings - load from package metadata
                flightDiscountEnabled: pkg.flight_discount_settings?.enabled || false,
                flightDiscountPercent: pkg.flight_discount_settings?.discount_percent || 25,
                flightDiscountMaxAmount: pkg.flight_discount_settings?.max_discount_amount || 200,
                flightDiscountValidityDays: pkg.flight_discount_settings?.validity_days || 90,
                basePrice: pkg.price || '',
                discountPercent: '',
                finalPrice: pkg.price || '',
                totalSlots: pkg.total_slots || '',
                availableUntil: pkg.available_until ? pkg.available_until.split('T')[0] + 'T' + pkg.available_until.split('T')[1].substring(0, 5) : ''
            });

            // Load existing coupons for this package
            try {
                const couponsResponse = await api.get(`/coupons/package/${packageId}`);
                setExistingCoupons(couponsResponse.data || []);
            } catch (couponsError) {
                console.error('Error loading package coupons:', couponsError);
                // Don't show error for coupons - they might not exist yet
                setExistingCoupons([]);
            }
        } catch (error) {
            console.error('Error loading package data:', error);
            toast.error('Failed to load package data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCoupon = (couponId) => {
        setExistingCoupons(prev => prev.filter(coupon => coupon.coupon_id !== couponId));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Validate required fields
            const missingFields = [];
            
            if (!packageData.title) missingFields.push('Package Title');
            if (!packageData.destination) missingFields.push('Destination');
            if (!packageData.startDate) missingFields.push('Start Date');
            if (!packageData.endDate) missingFields.push('End Date');
            
            if (missingFields.length > 0) {
                toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            // Prepare update payload
            const updatePayload = {
                title: packageData.title,
                description: packageData.description,
                destination: packageData.destination,
                start_date: packageData.startDate,
                end_date: packageData.endDate,
                group_size: packageData.groupSize || 1,
                // No flights array - just metadata for flight discounts
                flight_discount_metadata: packageData.flightDiscountEnabled ? {
                    enabled: true,
                    discount_percent: packageData.flightDiscountPercent || 25,
                    max_amount: packageData.flightDiscountMaxAmount || 200,
                    validity_days: packageData.flightDiscountValidityDays || 90
                } : null,
                hotels: packageData.hotels.map(hotel => ({
                    title: hotel.name,
                    description: hotel.description,
                    price: (hotel.price || 0) * (1 - (hotel.discount || 0) / 100),
                    hotel_name: hotel.name,
                    room_type: hotel.roomType || 'Standard',
                    optional: hotel.optional || false
                })),
                activities: packageData.activities.map(activity => ({
                    title: activity.name,
                    description: activity.description,
                    price: (activity.price || 0) * (1 - (activity.discount || 0) / 100),
                    activity_name: activity.name,
                    activity_type: activity.type,
                    duration_minutes: activity.duration || 60,
                    start_time: activity.startTime || '09:00:00',
                    end_time: activity.endTime || '17:00:00',
                    optional: activity.optional || false
                })),
                total_slots: packageData.totalSlots || 1,
                available_until: packageData.availableUntil && packageData.availableUntil.trim() !== '' ? packageData.availableUntil : null
            };

            console.log('Sending package update payload:', JSON.stringify(updatePayload, null, 2));

            // Use the update endpoint
            const response = await api.put(`/admin/packages/${packageId}`, updatePayload);

            toast.success('Package updated successfully!');
            onPackageUpdated();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Package update error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update package';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setPackageData({
            title: '',
            description: '',
            destination: null,
            startDate: '',
            endDate: '',
            groupSize: 1,
            hotels: [],
            activities: [],
            flightDiscountEnabled: true,
            flightDiscountPercent: 25,
            flightDiscountMaxAmount: 200,
            flightDiscountValidityDays: 90,
            basePrice: '',
            discountPercent: '',
            finalPrice: '',
            totalSlots: '',
            availableUntil: ''
        });
    };

    const steps = [
        { id: 1, title: 'Basic Info', icon: <MapPin size={20} /> },
        { id: 2, title: 'Hotels', icon: <Hotel size={20} /> },
        { id: 3, title: 'Activities', icon: <Activity size={20} /> },
        { id: 4, title: 'Flight Discounts', icon: <Plane size={20} /> },
        { id: 5, title: 'Pricing & Availability', icon: <DollarSign size={20} /> }
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <BasicInfoStep packageData={packageData} setPackageData={setPackageData} />;
            case 2:
                return <HotelSelectionStep packageData={packageData} setPackageData={setPackageData} />;
            case 3:
                return <ActivitySelectionStep packageData={packageData} setPackageData={setPackageData} />;
            case 4:
                return <FlightDiscountStep 
                    packageData={packageData} 
                    setPackageData={setPackageData} 
                    existingCoupons={existingCoupons}
                    onDeleteCoupon={handleDeleteCoupon}
                />;
            case 5:
                return <PricingAvailabilityStep packageData={packageData} setPackageData={setPackageData} />;
            default:
                return null;
        }
    };

    if (loading && !packageData.title) {
        return (
            <Modal open={isOpen} onClose={onClose} maxWidthClass="max-w-4xl">
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-white">Loading package data...</p>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal open={isOpen} onClose={onClose} maxWidthClass="max-w-4xl">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Edit Package</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 py-4 border-b border-gray-700">
                    <div className="flex justify-between">
                        {steps.map((step) => (
                            <div 
                                key={step.id} 
                                onClick={() => setCurrentStep(step.id)}
                                className={`flex items-center space-x-2 cursor-pointer transition-all duration-200 px-3 py-2 rounded-lg hover:bg-gray-700 ${
                                    currentStep === step.id ? 'text-orange-400 bg-orange-400/10' : 
                                    currentStep > step.id ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'
                                }`}
                            >
                                {step.icon}
                                <span className="text-sm font-medium">{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-700">
                    <button
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors"
                    >
                        Previous
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        {currentStep === steps.length ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                <span>{loading ? 'Updating...' : 'Update Package'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// Import the step components from CreatePackageModal (they can be reused)
// For now, I'll create simplified versions - in a real app, you'd extract these to separate files

const BasicInfoStep = ({ packageData, setPackageData }) => {
    const [showMapPicker, setShowMapPicker] = useState(false);

    const handleLocationSelected = (location) => {
        setPackageData(prev => ({ ...prev, destination: location }));
        setShowMapPicker(false);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-orange-400">Basic Package Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Package Title</label>
                    <input
                        type="text"
                        value={packageData.title}
                        onChange={(e) => setPackageData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        placeholder="Enter package title"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Group Size</label>
                    <input
                        type="number"
                        value={packageData.groupSize}
                        onChange={(e) => setPackageData(prev => ({ ...prev, groupSize: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        placeholder="Number of people"
                        min="1"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                    value={packageData.description}
                    onChange={(e) => setPackageData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder="Describe your package"
                    rows="3"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={packageData.destination ? `${packageData.destination.name}, ${packageData.destination.country}` : ''}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                        placeholder="Click to select destination on map"
                    />
                    <button
                        onClick={() => setShowMapPicker(true)}
                        className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        <MapPin size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                        type="date"
                        value={packageData.startDate}
                        onChange={(e) => setPackageData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                        type="date"
                        value={packageData.endDate}
                        onChange={(e) => setPackageData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                </div>
            </div>

            {showMapPicker && (
                <MapPicker
                    isOpen={showMapPicker}
                    onClose={() => setShowMapPicker(false)}
                    onLocationSelected={handleLocationSelected}
                />
            )}
        </div>
    );
};

// Flight Discount Configuration Step
const FlightDiscountStep = ({ packageData, setPackageData, existingCoupons, onDeleteCoupon }) => {
    const handleDeleteCoupon = async (couponId) => {
        if (!window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
            return;
        }
        
        try {
            await api.delete(`/coupons/${couponId}`);
            toast.success('Coupon deleted successfully');
            onDeleteCoupon(couponId);
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon');
        }
    };

    return (
        <div className="space-y-6">
            {/* Show existing coupons if any */}
            {existingCoupons && existingCoupons.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3">🎫 Existing Flight Discount Coupons</h3>
                    <div className="space-y-3">
                        {existingCoupons.map((coupon) => (
                            <div key={coupon.coupon_id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono bg-gray-700 px-3 py-1 rounded text-orange-400 font-bold">
                                            {coupon.coupon_code}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            coupon.status === 'active' ? 'bg-green-900 text-green-200' :
                                            coupon.status === 'used' ? 'bg-gray-900 text-gray-400' :
                                            coupon.status === 'expired' ? 'bg-red-900 text-red-200' :
                                            'bg-yellow-900 text-yellow-200'
                                        }`}>
                                            {coupon.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">{coupon.description}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                                        <div>
                                            <span className="block font-medium">Discount</span>
                                            <span>{coupon.discount_value}%</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium">Max Amount</span>
                                            <span>${coupon.max_discount_amount}</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium">Used</span>
                                            <span>{coupon.usage_count}/{coupon.usage_limit}</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium">Expires</span>
                                            <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteCoupon(coupon.coupon_id)}
                                    className="ml-4 text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded"
                                    title="Delete coupon"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="flightDiscountEnabled"
                    checked={packageData.flightDiscountEnabled}
                    onChange={(e) => setPackageData(prev => ({ 
                        ...prev, 
                        flightDiscountEnabled: e.target.checked 
                    }))}
                    className="w-5 h-5 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <label htmlFor="flightDiscountEnabled" className="text-white font-medium">
                    Include flight discount coupon with this package
                </label>
            </div>
            
            {packageData.flightDiscountEnabled && (
                <div className="space-y-4 bg-gray-800 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Discount Percentage
                            </label>
                            <input
                                type="number"
                                value={packageData.flightDiscountPercent}
                                onChange={(e) => setPackageData(prev => ({ 
                                    ...prev, 
                                    flightDiscountPercent: parseInt(e.target.value) || 0 
                                }))}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="10"
                                min="0"
                                max="100"
                            />
                            <p className="text-xs text-gray-400 mt-1">Discount percentage for flight bookings</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Maximum Discount Amount ($)
                            </label>
                            <input
                                type="number"
                                value={packageData.flightDiscountMaxAmount}
                                onChange={(e) => setPackageData(prev => ({ 
                                    ...prev, 
                                    flightDiscountMaxAmount: parseInt(e.target.value) || 0 
                                }))}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="200"
                                min="0"
                            />
                            <p className="text-xs text-gray-400 mt-1">Maximum discount amount cap</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Coupon Validity (Days)
                        </label>
                        <input
                            type="number"
                            value={packageData.flightDiscountValidityDays}
                            onChange={(e) => setPackageData(prev => ({ 
                                ...prev, 
                                flightDiscountValidityDays: parseInt(e.target.value) || 30 
                            }))}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="30"
                            min="1"
                        />
                        <p className="text-xs text-gray-400 mt-1">How many days the coupon remains valid after package booking</p>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-300">
                            <strong>Preview:</strong> Customers will receive a{' '}
                            <span className="text-orange-400">{packageData.flightDiscountPercent}%</span> discount 
                            (up to <span className="text-orange-400">${packageData.flightDiscountMaxAmount}</span>) 
                            on flight bookings, valid for{' '}
                            <span className="text-orange-400">{packageData.flightDiscountValidityDays} days</span>.
                        </p>
                    </div>
                    
                    <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mt-4">
                        <p className="text-sm text-blue-200">
                            <strong>ℹ️ Note:</strong> Individual flight discount coupons are automatically generated when customers book this package. 
                            Coupons will appear in the "Existing Coupons" section above after the first booking.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Hotel editing component
const HotelSelectionStep = ({ packageData, setPackageData }) => {
    const addHotel = () => {
        const newHotel = {
            id: Date.now(),
            name: '',
            description: '',
            roomType: 'Standard',
            price: '',
            discount: '',
            optional: false,
            rating: '',
            amenities: ''
        };
        setPackageData(prev => ({
            ...prev,
            hotels: [...prev.hotels, newHotel]
        }));
    };

    const updateHotel = (index, field, value) => {
        setPackageData(prev => ({
            ...prev,
            hotels: prev.hotels.map((hotel, i) => 
                i === index ? { ...hotel, [field]: value } : hotel
            )
        }));
    };

    const removeHotel = (index) => {
        setPackageData(prev => ({
            ...prev,
            hotels: prev.hotels.filter((_, i) => i !== index)
        }));
    };

    const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential Suite', 'Single', 'Double', 'Twin', 'Family Room'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-orange-400">Hotel Information</h3>
                <button
                    onClick={addHotel}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <Plus size={16} />
                    <span>Add Hotel</span>
                </button>
            </div>

            <div className="space-y-4">
                {packageData.hotels.map((hotel, index) => (
                    <div key={hotel.id || index} className="p-4 bg-gray-700 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-white">Hotel {index + 1}</h4>
                            <div className="flex items-center space-x-2">
                                {(hotel.hotel_name || hotel.name) && (
                                    <div className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                                        Current: {hotel.hotel_name || hotel.name} 
                                        {hotel.room_type && ` (${hotel.room_type})`}
                                        {hotel.price && ` - $${hotel.price}`}
                                    </div>
                                )}
                                <button
                                    onClick={() => removeHotel(index)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                >
                                    <Minus size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Hotel Name
                                    {(hotel.hotel_name || hotel.name) && <span className="text-xs text-orange-400 ml-2">(Current: {hotel.hotel_name || hotel.name})</span>}
                                </label>
                                <input
                                    type="text"
                                    value={hotel.hotel_name || hotel.name || ''}
                                    onChange={(e) => updateHotel(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="e.g., Grand Plaza Hotel"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Room Type
                                    {(hotel.room_type || hotel.roomType) && <span className="text-xs text-orange-400 ml-2">(Current: {hotel.room_type || hotel.roomType})</span>}
                                </label>
                                <select
                                    value={hotel.room_type || hotel.roomType || 'Standard'}
                                    onChange={(e) => updateHotel(index, 'roomType', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                >
                                    {roomTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Price per Night ($)
                                    {hotel.price && <span className="text-xs text-orange-400 ml-2">(Current: ${hotel.price})</span>}
                                </label>
                                <input
                                    type="number"
                                    value={hotel.price || ''}
                                    onChange={(e) => updateHotel(index, 'price', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="Price per night"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Discount (%)</label>
                                <input
                                    type="number"
                                    value={hotel.discount || ''}
                                    onChange={(e) => updateHotel(index, 'discount', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="Discount percentage"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Rating (1-5 stars)</label>
                                <input
                                    type="number"
                                    value={hotel.rating || ''}
                                    onChange={(e) => updateHotel(index, 'rating', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="Hotel rating"
                                    min="1"
                                    max="5"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center space-x-2 text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={hotel.optional || false}
                                        onChange={(e) => updateHotel(index, 'optional', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-orange-500 bg-gray-600 border-gray-500 rounded focus:ring-orange-500"
                                    />
                                    <span>Optional Hotel</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea
                                value={hotel.description || ''}
                                onChange={(e) => updateHotel(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                placeholder="Brief description of the hotel"
                                rows="2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Amenities</label>
                            <input
                                type="text"
                                value={hotel.amenities || ''}
                                onChange={(e) => updateHotel(index, 'amenities', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                placeholder="e.g., WiFi, Pool, Gym, Spa (comma separated)"
                            />
                        </div>
                    </div>
                ))}

                {packageData.hotels.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <Hotel size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No hotels added yet. Click "Add Hotel" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Activity editing component
const ActivitySelectionStep = ({ packageData, setPackageData }) => {
    const addActivity = () => {
        const newActivity = {
            id: Date.now(),
            name: '',
            description: '',
            type: 'adventure',
            price: '',
            discount: '',
            duration: '',
            startTime: '09:00',
            endTime: '17:00',
            optional: false
        };
        setPackageData(prev => ({
            ...prev,
            activities: [...prev.activities, newActivity]
        }));
    };

    const updateActivity = (index, field, value) => {
        setPackageData(prev => ({
            ...prev,
            activities: prev.activities.map((activity, i) => 
                i === index ? { ...activity, [field]: value } : activity
            )
        }));
    };

    const removeActivity = (index) => {
        setPackageData(prev => ({
            ...prev,
            activities: prev.activities.filter((_, i) => i !== index)
        }));
    };

    const activityTypes = ['adventure', 'leisure', 'cultural', 'nature', 'sports'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-orange-400">Activity Information</h3>
                <button
                    onClick={addActivity}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <Plus size={16} />
                    <span>Add Activity</span>
                </button>
            </div>

            <div className="space-y-4">
                {packageData.activities.map((activity, index) => (
                    <div key={activity.id || index} className="p-4 bg-gray-700 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-white">Activity {index + 1}</h4>
                            <div className="flex items-center space-x-2">
                                {(activity.activity_name || activity.name) && (
                                    <div className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                                        Current: {activity.activity_name || activity.name} 
                                        {(activity.activity_type || activity.type) && ` (${activity.activity_type || activity.type})`}
                                        {activity.price && ` - $${activity.price}`}
                                    </div>
                                )}
                                <button
                                    onClick={() => removeActivity(index)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                >
                                    <Minus size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Activity Name
                                    {(activity.activity_name || activity.name) && <span className="text-xs text-orange-400 ml-2">(Current: {activity.activity_name || activity.name})</span>}
                                </label>
                                <input
                                    type="text"
                                    value={activity.activity_name || activity.name || ''}
                                    onChange={(e) => updateActivity(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="e.g., Mountain Hiking, City Tour"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Activity Type
                                    {(activity.activity_type || activity.type) && <span className="text-xs text-orange-400 ml-2">(Current: {activity.activity_type || activity.type})</span>}
                                </label>
                                <select
                                    value={activity.activity_type || activity.type || 'adventure'}
                                    onChange={(e) => updateActivity(index, 'type', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                >
                                    {activityTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Price ($)
                                    {activity.price && <span className="text-xs text-orange-400 ml-2">(Current: ${activity.price})</span>}
                                </label>
                                <input
                                    type="number"
                                    value={activity.price || ''}
                                    onChange={(e) => updateActivity(index, 'price', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="Activity price"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Duration (hours)
                                    {(activity.duration_minutes || activity.duration) && (
                                        <span className="text-xs text-orange-400 ml-2">
                                            (Current: {activity.duration_minutes ? (activity.duration_minutes / 60) : activity.duration}h)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    value={activity.duration_minutes ? (activity.duration_minutes / 60) : (activity.duration || '')}
                                    onChange={(e) => updateActivity(index, 'duration', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="Duration in hours"
                                    min="0.5"
                                    step="0.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                                <input
                                    type="time"
                                    value={activity.start_time || activity.startTime || '09:00'}
                                    onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                                <input
                                    type="time"
                                    value={activity.end_time || activity.endTime || '17:00'}
                                    onChange={(e) => updateActivity(index, 'endTime', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Discount (%)</label>
                                <input
                                    type="number"
                                    value={activity.discount || ''}
                                    onChange={(e) => updateActivity(index, 'discount', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                    placeholder="Discount percentage"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center space-x-2 text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={activity.optional || false}
                                        onChange={(e) => updateActivity(index, 'optional', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-orange-500 bg-gray-600 border-gray-500 rounded focus:ring-orange-500"
                                    />
                                    <span>Optional Activity</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea
                                value={activity.description || ''}
                                onChange={(e) => updateActivity(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                placeholder="Brief description of the activity"
                                rows="2"
                            />
                        </div>
                    </div>
                ))}

                {packageData.activities.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <Activity size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No activities added yet. Click "Add Activity" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PricingAvailabilityStep = ({ packageData, setPackageData }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-orange-400">Pricing & Availability</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Slots</label>
                <input
                    type="number"
                    value={packageData.totalSlots}
                    onChange={(e) => setPackageData(prev => ({ ...prev, totalSlots: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder="Number of available slots"
                    min="1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Available Until</label>
                <input
                    type="datetime-local"
                    value={packageData.availableUntil}
                    onChange={(e) => setPackageData(prev => ({ ...prev, availableUntil: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
            </div>
        </div>
    </div>
);

export default EditPackageModal;
