import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Plane, Hotel, Activity, Calendar, Users, DollarSign, Plus, Minus, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import MapPicker from '../common/MapPicker';

const CreatePackageModal = ({ isOpen, onClose, onPackageCreated }) => {
    const [currentStep, setCurrentStep] = useState(1);
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

    const [searchResults, setSearchResults] = useState({
        flights: [],
        hotels: [],
        activities: []
    });

    const [searchQueries, setSearchQueries] = useState({
        flight: '',
        hotel: '',
        activity: ''
    });

    const [loading, setLoading] = useState(false);

    // Handle location selection from map picker
    const handleLocationSelected = useCallback((locationData) => {
        setPackageData(prev => ({ 
            ...prev, 
            destination: {
                id: `${locationData.latitude}-${locationData.longitude}`, // Use coordinates as unique ID
                name: locationData.name || "Selected Location",
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                country: locationData.country || "Unknown Country",
                address: {
                    cityName: locationData.city || locationData.name || "Selected Location",
                    countryName: locationData.country || "Unknown Country"
                }
            }
        }));
    }, []);

    // Calculate pricing when components change
    useEffect(() => {
        const hotelTotal = packageData.hotels.reduce((sum, h) => {
            const price = isNaN(h.price) ? 0 : h.price;
            const discount = isNaN(h.discount) ? 0 : h.discount;
            return sum + (price * (1 - discount / 100));
        }, 0);
        
        const activityTotal = packageData.activities.reduce((sum, a) => {
            const price = isNaN(a.price) ? 0 : a.price;
            const discount = isNaN(a.discount) ? 0 : a.discount;
            return sum + (price * (1 - discount / 100));
        }, 0);
        
        const basePrice = hotelTotal + activityTotal;
        const discountPercent = isNaN(packageData.discountPercent) ? 0 : packageData.discountPercent;
        const finalPrice = basePrice * (1 - discountPercent / 100);
        
        setPackageData(prev => ({ ...prev, basePrice, finalPrice }));
    }, [packageData.hotels, packageData.activities, packageData.discountPercent]);

    const steps = [
        { id: 1, title: 'Basic Info', icon: <MapPin size={20} /> },
        { id: 2, title: 'Hotels', icon: <Hotel size={20} /> },
        { id: 3, title: 'Activities', icon: <Activity size={20} /> },
        { id: 4, title: 'Flight Discounts', icon: <Plane size={20} /> },
        { id: 5, title: 'Pricing & Availability', icon: <DollarSign size={20} /> }
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Debug: Log current package data
            console.log('Current package data:', JSON.stringify(packageData, null, 2));

            // Validate required fields with specific error messages
            const missingFields = [];
            
            if (!packageData.title) missingFields.push('Package Title');
            if (!packageData.destination) missingFields.push('Destination');
            if (!packageData.startDate) missingFields.push('Start Date');
            if (!packageData.endDate) missingFields.push('End Date');
            
            if (missingFields.length > 0) {
                toast.error(`Please fill in: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            // Additional validation for destination
            if (!packageData.destination.id) {
                toast.error('Please select a valid destination from the map');
                setLoading(false);
                return;
            }

            // Prepare the complete package data
            const packagePayload = {
                title: packageData.title,
                description: packageData.description,
                price: packageData.finalPrice || 0,
                // Note: created_by will be handled on backend (set to null for now)
                destination: packageData.destination, // Send the full destination object
                start_date: packageData.startDate,
                end_date: packageData.endDate,
                group_size: packageData.groupSize || 1,
                flight_discount_settings: packageData.flightDiscountEnabled ? {
                    enabled: true,
                    discount_percent: packageData.flightDiscountPercent,
                    max_discount_amount: packageData.flightDiscountMaxAmount,
                    validity_days: packageData.flightDiscountValidityDays
                } : {
                    enabled: false
                },
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
                available_until: packageData.availableUntil
            };

            console.log('Sending package payload:', JSON.stringify(packagePayload, null, 2));

            // Use the comprehensive package creation endpoint
            const response = await api.post('/admin/packages/complete', packagePayload);

            toast.success('Package created successfully!');
            onPackageCreated();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Package creation error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create package';
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
        setSearchQueries({ flight: '', hotel: '', activity: '' });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Package Title</label>
                            <input
                                type="text"
                                value={packageData.title}
                                onChange={(e) => setPackageData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g., Ultimate Bali Adventure"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea
                                value={packageData.description}
                                onChange={(e) => setPackageData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                                rows={4}
                                placeholder="Describe the amazing experience..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Destination</label>
                            <div className="h-60 md:h-72 rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800">
                                <MapPicker onLocationSelected={handleLocationSelected} />
                            </div>
                            {packageData.destination && (
                                <div className="mt-2 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                                    <p className="text-green-400">Selected: {packageData.destination.name}</p>
                                    <p className="text-sm text-gray-400">{packageData.destination.address.cityName}, {packageData.destination.address.countryName}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={packageData.startDate}
                                    onChange={(e) => setPackageData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={packageData.endDate}
                                    onChange={(e) => setPackageData(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Group Size</label>
                            <input
                                type="number"
                                min="1"
                                value={packageData.groupSize}
                                onChange={(e) => {
                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                                    setPackageData(prev => ({ ...prev, groupSize: value }));
                                }}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                );

            case 2:
                return <HotelSelectionStep packageData={packageData} setPackageData={setPackageData} />;
            
            case 3:
                return <ActivitySelectionStep packageData={packageData} setPackageData={setPackageData} />;
            
            case 4:
                return <FlightDiscountStep packageData={packageData} setPackageData={setPackageData} />;
            
            case 5:
                return <PricingStep packageData={packageData} setPackageData={setPackageData} />;
            
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <Modal open={isOpen} onClose={onClose} maxWidthClass="max-w-4xl">
            <div className="bg-gray-800 text-white rounded-xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-orange-400">Create Travel Package</h2>
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
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                    >
                        Previous
                    </button>
                    
                    <span className="text-gray-400">Step {currentStep} of {steps.length}</span>
                    
                    {currentStep === steps.length ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Package'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// Individual step components would go here...
// Flight Discount Configuration Step
const FlightDiscountStep = ({ packageData, setPackageData }) => {
    return (
        <div className="space-y-6">
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
                <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                    <h4 className="font-medium text-gray-300">Coupon Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Discount Percentage</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="5"
                                    max="50"
                                    value={packageData.flightDiscountPercent}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 25;
                                        setPackageData(prev => ({ 
                                            ...prev, 
                                            flightDiscountPercent: Math.min(50, Math.max(5, value))
                                        }));
                                    }}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 pr-8"
                                />
                                <span className="absolute right-3 top-3 text-gray-400">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Between 5% and 50%</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Discount Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">$</span>
                                <input
                                    type="number"
                                    min="50"
                                    max="1000"
                                    step="25"
                                    value={packageData.flightDiscountMaxAmount}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 200;
                                        setPackageData(prev => ({ 
                                            ...prev, 
                                            flightDiscountMaxAmount: Math.min(1000, Math.max(50, value))
                                        }));
                                    }}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 pl-8"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Maximum savings per booking</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Coupon Validity (Days)</label>
                            <select
                                value={packageData.flightDiscountValidityDays}
                                onChange={(e) => setPackageData(prev => ({ 
                                    ...prev, 
                                    flightDiscountValidityDays: parseInt(e.target.value)
                                }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                            >
                                <option value={30}>30 days</option>
                                <option value={60}>60 days</option>
                                <option value={90}>90 days</option>
                                <option value={120}>120 days</option>
                                <option value={180}>180 days</option>
                                <option value={365}>1 year</option>
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Preview Coupon Code</label>
                                <div className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 font-mono text-sm">
                                    {packageData.destination?.name ? 
                                        `${packageData.destination.name.slice(0,4).toUpperCase()}${packageData.flightDiscountPercent}-XXXXXX` : 
                                        `TRIP${packageData.flightDiscountPercent}-XXXXXX`
                                    }
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Actual code generated automatically</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                        <h5 className="font-medium text-green-400 mb-2">How it works:</h5>
                        <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Customers book your package (hotels + activities)</li>
                            <li>• They receive a unique <strong>{packageData.flightDiscountPercent}% discount coupon</strong> via email</li>
                            <li>• They can search and book flights separately using their coupon</li>
                            <li>• Maximum savings: <strong>${packageData.flightDiscountMaxAmount}</strong> per flight booking</li>
                            <li>• Coupon expires in <strong>{packageData.flightDiscountValidityDays} days</strong></li>
                        </ul>
                    </div>
                </div>
            )}

            {!packageData.flightDiscountEnabled && (
                <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                        📝 <strong>Flight discount disabled:</strong> Customers will book this package without flight discounts. 
                        They can still search and book flights separately through our flight booking system.
                    </p>
                </div>
            )}
        </div>
    );
};

const HotelSelectionStep = ({ packageData, setPackageData }) => {
    const [newHotel, setNewHotel] = useState({
        name: '',
        description: '',
        roomType: 'Standard',
        price: '',
        discount: '',
        optional: false
    });

    const addHotel = () => {
        if (newHotel.name && newHotel.price) {
            setPackageData(prev => ({
                ...prev,
                hotels: [...prev.hotels, { ...newHotel, id: Date.now() }]
            }));
            setNewHotel({ name: '', description: '', roomType: 'Standard', price: '', discount: '', optional: false });
        }
    };

    const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-orange-400">Add Hotels</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <input
                    placeholder="Hotel Name"
                    value={newHotel.name}
                    onChange={(e) => setNewHotel(prev => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <select
                    value={newHotel.roomType}
                    onChange={(e) => setNewHotel(prev => ({ ...prev, roomType: e.target.value }))}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    {roomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Price per night"
                    value={newHotel.price}
                    onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                        setNewHotel(prev => ({ ...prev, price: value }));
                    }}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <input
                    type="number"
                    placeholder="Discount %"
                    value={newHotel.discount}
                    onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                        setNewHotel(prev => ({ ...prev, discount: value }));
                    }}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <textarea
                    placeholder="Hotel description..."
                    value={newHotel.description}
                    onChange={(e) => setNewHotel(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    rows={2}
                />
                <label className="flex items-center space-x-2 text-gray-300">
                    <input
                        type="checkbox"
                        checked={newHotel.optional}
                        onChange={(e) => setNewHotel(prev => ({ ...prev, optional: e.target.checked }))}
                        className="rounded bg-gray-700 border-gray-600"
                    />
                    <span>Optional</span>
                </label>
            </div>
            
            <button
                onClick={addHotel}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                <Plus size={16} />
                <span>Add Hotel</span>
            </button>

            {packageData.hotels.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-gray-300">Added Hotels:</h4>
                    {packageData.hotels.map((hotel, index) => (
                        <div key={hotel.id} className="p-3 bg-gray-700 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-medium">{hotel.name} - {hotel.roomType}</p>
                                <p className="text-sm text-gray-400">
                                    ${hotel.price || 0} ({hotel.discount || 0}% discount) = ${((hotel.price || 0) * (1 - (hotel.discount || 0) / 100)).toFixed(2)}
                                    {hotel.optional && <span className="ml-2 text-yellow-400">(Optional)</span>}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setPackageData(prev => ({
                                        ...prev,
                                        hotels: prev.hotels.filter((_, i) => i !== index)
                                    }));
                                }}
                                className="text-red-400 hover:text-red-300"
                            >
                                <Minus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ActivitySelectionStep = ({ packageData, setPackageData }) => {
    const [newActivity, setNewActivity] = useState({
        name: '',
        description: '',
        type: 'adventure', // Use valid enum value
        duration: '',
        price: '',
        discount: '',
        optional: true,
        startTime: '09:00',
        endTime: '17:00'
    });

    const addActivity = () => {
        if (newActivity.name && newActivity.price) {
            setPackageData(prev => ({
                ...prev,
                activities: [...prev.activities, { ...newActivity, id: Date.now() }]
            }));
            setNewActivity({
                name: '', description: '', type: 'adventure', duration: '',
                price: '', discount: '', optional: true, startTime: '09:00', endTime: '17:00'
            });
        }
    };

    const activityTypes = [
        'adventure', 'leisure', 'cultural', 
        'nature', 'sports'
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-orange-400">Add Activities</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <input
                    placeholder="Activity Name"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                    {activityTypes.map(type => (
                        <option key={type} value={type}>
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={newActivity.duration}
                    onChange={(e) => {
                        const value = e.target.value === '' ? 60 : parseInt(e.target.value) || 60;
                        setNewActivity(prev => ({ ...prev, duration: value }));
                    }}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <input
                    type="number"
                    placeholder="Price"
                    value={newActivity.price}
                    onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                        setNewActivity(prev => ({ ...prev, price: value }));
                    }}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <input
                    type="number"
                    placeholder="Discount %"
                    value={newActivity.discount}
                    onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                        setNewActivity(prev => ({ ...prev, discount: value }));
                    }}
                    className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <div className="flex space-x-2">
                    <input
                        type="time"
                        value={newActivity.startTime}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, startTime: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <input
                        type="time"
                        value={newActivity.endTime}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, endTime: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                </div>
                <textarea
                    placeholder="Activity description..."
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    rows={2}
                />
                <label className="flex items-center space-x-2 text-gray-300">
                    <input
                        type="checkbox"
                        checked={newActivity.optional}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, optional: e.target.checked }))}
                        className="rounded bg-gray-700 border-gray-600"
                    />
                    <span>Optional</span>
                </label>
            </div>
            
            <button
                onClick={addActivity}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                <Plus size={16} />
                <span>Add Activity</span>
            </button>

            {packageData.activities.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-gray-300">Added Activities:</h4>
                    {packageData.activities.map((activity, index) => (
                        <div key={activity.id} className="p-3 bg-gray-700 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-medium">{activity.name} - {activity.type.replace('_', ' ')}</p>
                                <p className="text-sm text-gray-400">
                                    {activity.duration || 60}min, ${activity.price || 0} ({activity.discount || 0}% discount) = ${((activity.price || 0) * (1 - (activity.discount || 0) / 100)).toFixed(2)}
                                    {activity.optional && <span className="ml-2 text-yellow-400">(Optional)</span>}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setPackageData(prev => ({
                                        ...prev,
                                        activities: prev.activities.filter((_, i) => i !== index)
                                    }));
                                }}
                                className="text-red-400 hover:text-red-300"
                            >
                                <Minus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PricingStep = ({ packageData, setPackageData }) => {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-orange-400">Pricing & Availability</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Package Discount %</label>
                    <input
                        type="number"
                        value={packageData.discountPercent}
                        onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                            setPackageData(prev => ({ ...prev, discountPercent: value }));
                        }}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Slots</label>
                    <input
                        type="number"
                        value={packageData.totalSlots}
                        onChange={(e) => {
                            const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                            setPackageData(prev => ({ ...prev, totalSlots: value }));
                        }}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Available Until</label>
                <input
                    type="datetime-local"
                    value={packageData.availableUntil}
                    onChange={(e) => setPackageData(prev => ({ ...prev, availableUntil: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-300 mb-2">Pricing Summary</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>${(packageData.basePrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Package Discount ({packageData.discountPercent || 0}%):</span>
                        <span>-${((packageData.basePrice || 0) * (packageData.discountPercent || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-orange-400 border-t border-gray-600 pt-1">
                        <span>Final Price:</span>
                        <span>${(packageData.finalPrice || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePackageModal;
