import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, MapPin, DollarSign, CreditCard, Loader2, Gift, Tag, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PackageBookingModal({ packageData, onClose, onBookingComplete }) {
    const [passengerDetails, setPassengerDetails] = useState([{
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        passportNumber: ''
    }]);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [couponLoading, setCouponLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Passenger Details, 2: Payment
    const [userCoupons, setUserCoupons] = useState([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [showCouponDropdown, setShowCouponDropdown] = useState(false);

    const packageInfo = packageData.package;
    const basePrice = packageInfo.price;
    const numPassengers = passengerDetails.length;
    const subtotal = basePrice * numPassengers;
    // Recalculate discount based on appliedCoupon state
    const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
    const finalAmount = subtotal - discount;

    // Function to fetch user's available coupons
    const fetchUserCoupons = async () => {
        setLoadingCoupons(true);
        try {
            console.log('Fetching user coupons...');
            // Fetch coupons that are 'available' for the current user
            const response = await api.get('/coupons/my-coupons?status=available');
            console.log('Coupons API response:', response.data);

            if (response.data.success) {
                // Filter for coupons applicable to packages or general use
                const availableCoupons = response.data.coupons.filter(coupon =>
                    coupon.current_status === 'available' && // Ensure it's truly available
                    (coupon.applicable_to_packages ||
                        coupon.coupon_type === 'package_discount' ||
                        coupon.coupon_type === 'general' ||
                        !coupon.applicable_to_flights) // Include non-flight specific coupons
                );
                setUserCoupons(availableCoupons);
                console.log('Loaded available coupons for packages:', availableCoupons);
            }
        } catch (error) {
            console.error('Error fetching user coupons:', error);
            console.error('Coupons fetch failed with:', error.response?.data);
            // Don't show error toast, as coupons are optional and an empty list is fine
        } finally {
            setLoadingCoupons(false);
        }
    };

    // Load user's available coupons when modal opens
    useEffect(() => {
        fetchUserCoupons();
    }, []);

    const selectCoupon = (coupon) => {
        setCouponCode(coupon.coupon_code);
        setShowCouponDropdown(false);
        applyCouponLogic(coupon.coupon_code); // Use the common apply logic
    };

    const updatePassengerDetail = (index, field, value) => {
        const updated = [...passengerDetails];
        updated[index][field] = value;
        setPassengerDetails(updated);
    };

    const addPassenger = () => {
        if (passengerDetails.length < packageInfo.group_size) {
            setPassengerDetails([...passengerDetails, {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                passportNumber: ''
            }]);
        }
    };

    const removePassenger = (index) => {
        if (passengerDetails.length > 1) {
            const updated = passengerDetails.filter((_, i) => i !== index);
            setPassengerDetails(updated);
        }
    };

    const validatePassengerDetails = () => {
        if (passengerDetails.length === 0) {
            toast.error('At least one passenger is required');
            return false;
        }

        for (let i = 0; i < passengerDetails.length; i++) {
            const passenger = passengerDetails[i];
            if (!passenger.firstName?.trim() || !passenger.lastName?.trim()) {
                toast.error(`Please fill in first and last name for passenger ${i + 1}`);
                return false;
            }
            if (passenger.email && passenger.email.trim()) {
                // Basic email validation only if email is provided
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(passenger.email.trim())) {
                    toast.error(`Please enter a valid email for passenger ${i + 1}`);
                    return false;
                }
            }
        }
        return true;
    };
    const applyCouponLogic = async (codeToApply) => {
        if (!codeToApply.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        try {
            const response = await api.post('/coupons/apply', {
                coupon_code: codeToApply.trim(),
                original_amount: subtotal
            });

            if (response.data.success) {
                setAppliedCoupon({
                    ...response.data.coupon,
                    discount_amount: response.data.pricing.discount_amount
                });
                toast.success('Coupon applied successfully!');
                setShowCouponDropdown(false); // Close dropdown after applying
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            let errorMessage = 'Failed to apply coupon';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            toast.error(errorMessage);
            setCouponCode(''); // Clear coupon code on failure
            setAppliedCoupon(null); // Clear applied coupon on failure
        } finally {
            setCouponLoading(false);
        }
    };

    // This function will be called by the "Apply" button for manual entry
    const handleApplyCoupon = () => {
        applyCouponLogic(couponCode);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        toast.success('Coupon removed');
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (validatePassengerDetails()) {
                setStep(2);
            }
        }
    };

    const handleBooking = async () => {
        if (!validatePassengerDetails()) return;

        setLoading(true);
        try {
            const bookingData = {
                package_id: packageInfo.package_id,
                passenger_details: passengerDetails,
                total_amount: finalAmount,
                original_amount: subtotal,
                discount_amount: discount,
                coupon_code: appliedCoupon?.coupon_code || null
            };

            console.log('Sending package booking data:', bookingData); // Add logging

            const response = await api.post('/packages/book', bookingData);

            console.log('Package booking response:', response.data); // Add logging

            if (response.data.success) {
                // Show success message with generated coupon info
                if (response.data.booking.flight_discount_coupon) {
                    const coupon = response.data.booking.flight_discount_coupon;
                    toast.success(
                        <div>
                            <p className="font-semibold">Package booked successfully! 🎉</p>
                            <p className="text-sm mt-1">
                                🎁 Bonus: Flight coupon <strong>{coupon.coupon_code}</strong> added to your account!
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {coupon.discount_percent}% off flights (max ${coupon.max_discount_amount})
                            </p>
                        </div>,
                        {
                            duration: 8000,
                            style: {
                                background: '#10b981',
                                color: 'white',
                            }
                        }
                    );
                } else {
                    toast.success('Package booked successfully!');
                }
                onBookingComplete(response.data.booking);
            } else {
                console.error('Booking failed with success=false:', response.data);
                toast.error(response.data.message || 'Failed to book package');
            }
        } catch (error) {
            console.error('Error booking package:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to book package');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold text-white">Book Package</h3>
                        <p className="text-gray-400">{packageInfo.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Package Summary */}
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <MapPin size={20} />
                            Package Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <p className="text-gray-300">
                                    <span className="text-gray-400">Destination:</span> {packageInfo.location_name}, {packageInfo.country}
                                </p>
                                <p className="text-gray-300">
                                    <span className="text-gray-400">Duration:</span> {formatDate(packageInfo.start_date)} - {formatDate(packageInfo.end_date)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-300">
                                    <span className="text-gray-400">Group Size:</span> Up to {packageInfo.group_size} people
                                </p>
                                <p className="text-gray-300">
                                    <span className="text-gray-400">Price per person:</span> {formatPrice(basePrice)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {step === 1 && (
                        <>
                            {/* Passenger Details */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-white flex items-center gap-2">
                                        <Users size={20} />
                                        Passenger Details ({passengerDetails.length}/{packageInfo.group_size})
                                    </h4>
                                    {passengerDetails.length < packageInfo.group_size && (
                                        <button
                                            onClick={addPassenger}
                                            className="text-purple-400 hover:text-purple-300 text-sm underline"
                                        >
                                            + Add Another Passenger
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {passengerDetails.map((passenger, index) => (
                                        <div key={index} className="bg-gray-800/30 p-4 rounded-lg">
                                            <div className="flex justify-between items-center mb-3">
                                                <h5 className="font-medium text-white">Passenger {index + 1}</h5>
                                                {passengerDetails.length > 1 && (
                                                    <button
                                                        onClick={() => removePassenger(index)}
                                                        className="text-red-400 hover:text-red-300 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                                        First Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={passenger.firstName}
                                                        onChange={(e) => updatePassengerDetail(index, 'firstName', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                                        Last Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={passenger.lastName}
                                                        onChange={(e) => updatePassengerDetail(index, 'lastName', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                                        Email *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={passenger.email}
                                                        onChange={(e) => updatePassengerDetail(index, 'email', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                                        Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={passenger.phone}
                                                        onChange={(e) => updatePassengerDetail(index, 'phone', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                                        Date of Birth
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={passenger.dateOfBirth}
                                                        onChange={(e) => updatePassengerDetail(index, 'dateOfBirth', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                                        Passport Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={passenger.passportNumber}
                                                        onChange={(e) => updatePassengerDetail(index, 'passportNumber', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Continue Button */}
                            <div className="flex justify-end pt-4 border-t border-gray-700">
                                <button
                                    onClick={handleNextStep}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Coupon Section */}
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                    <Tag size={20} />
                                    Discount Coupon <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                                </h4>

                                <div className="text-sm text-gray-400 mb-3">
                                    Have a discount coupon? Apply it here to save on your booking.
                                </div>

                                {/* Available Coupons Display */}
                                {userCoupons.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-green-400 font-medium">Your Available Coupons</span>
                                            <button
                                                onClick={() => setShowCouponDropdown(!showCouponDropdown)}
                                                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                                            >
                                                View ({userCoupons.length})
                                                <ChevronDown size={16} className={`transform transition-transform ${showCouponDropdown ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        {showCouponDropdown && (
                                            <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
                                                {userCoupons.map((coupon) => (
                                                    <div
                                                        key={coupon.coupon_id}
                                                        onClick={() => selectCoupon(coupon)}
                                                        className="p-3 bg-gray-600/50 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border border-gray-500"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium text-purple-300">{coupon.coupon_code}</p>
                                                                <p className="text-sm text-gray-300">{coupon.title}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {coupon.discount_type === 'percentage'
                                                                        ? `${coupon.discount_value}% off`
                                                                        : `$${coupon.discount_value} off`}
                                                                    {coupon.max_discount_amount && ` (max $${coupon.max_discount_amount})`}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Expires {new Date(coupon.valid_until).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!appliedCoupon ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Enter coupon code manually"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                            <button
                                                onClick={handleApplyCoupon} // Use the new handler for manual apply
                                                disabled={couponLoading || !couponCode.trim()}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                            >
                                                {couponLoading ? (
                                                    <Loader2 className="animate-spin" size={16} />
                                                ) : (
                                                    <Gift size={16} />
                                                )}
                                                Apply
                                            </button>
                                        </div>

                                        {loadingCoupons && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Loader2 className="animate-spin" size={14} />
                                                Loading your coupons...
                                            </div>
                                        )}

                                        {!loadingCoupons && userCoupons.length === 0 && (
                                            <div className="text-sm text-gray-500 bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Gift size={16} className="text-purple-400" />
                                                    <span className="font-medium text-purple-300">No coupons available yet</span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    💡 Book packages to earn flight discount coupons! Each package booking rewards you with a coupon for future flight bookings.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center p-3 bg-green-900/30 border border-green-600/30 rounded-lg">
                                        <div>
                                            <p className="text-green-400 font-medium">{appliedCoupon.coupon_code}</p>
                                            <p className="text-sm text-green-300">{appliedCoupon.title}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-green-400 font-bold">-{formatPrice(discount)}</span>
                                            <button
                                                onClick={removeCoupon}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Price Summary */}
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                    <DollarSign size={20} />
                                    Price Summary
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Package price × {numPassengers} passenger{numPassengers > 1 ? 's' : ''}</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Coupon discount</span>
                                            <span>-{formatPrice(discount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-600 pt-2 flex justify-between text-white font-semibold text-lg">
                                        <span>Total</span>
                                        <span>{formatPrice(finalAmount)}</span>
                                    </div>
                                </div>

                                {/* Flight Discount Reward Notice */}
                                <div className="bg-purple-900/30 border border-purple-600/30 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
                                        <Gift size={16} />
                                        <span className="font-medium">🎁 Bonus Reward Included!</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-purple-200 text-sm">
                                            After booking this package, you'll automatically receive:
                                        </p>
                                        <div className="bg-purple-800/30 p-3 rounded-lg border border-purple-600/20">
                                            <p className="text-purple-100 font-medium text-sm">✈️ Flight Discount Coupon</p>
                                            <p className="text-purple-200 text-xs mt-1">
                                                • Up to 25% off your next flight booking<br />
                                                • Maximum discount: $200<br />
                                                • Valid for 90 days<br />
                                                • Automatically added to your account
                                            </p>
                                        </div>
                                        <p className="text-purple-300 text-xs">
                                            💡 This coupon will appear in your available coupons for future bookings!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleBooking}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Confirm Booking - {formatPrice(finalAmount)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}