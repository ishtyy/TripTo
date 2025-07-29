import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Calendar, Users, DollarSign, Loader2, RotateCcw, Eye, ShoppingCart, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PackageBookingModal from './PackageBookingModal';

export default function PackageSearch() {
    const [destination, setDestination] = useState('');
    const [month, setMonth] = useState('');
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Load packages on component mount
    useEffect(() => {
        loadPackages();
    }, []);

    // Handle Enter key press for search
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const loadPackages = async (searchParams = {}) => {
        setLoading(true);
        try {
            console.log('Loading packages with params:', searchParams);
            const response = await api.get('/packages/search', {
                params: {
                    page: 1,
                    limit: 20,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    ...searchParams
                }
            });

            console.log('API response:', response.data);

            if (response.data.success) {
                setPackages(response.data.packages); // Corrected: Access response.data.packages
                setSearchPerformed(true);
                console.log(`Loaded ${response.data.packages.length} packages`); // Corrected: Access response.data.packages
            } else {
                toast.error('Failed to load packages');
                console.error('API returned success: false');
            }
        } catch (error) {
            console.error('Error loading packages:', error);
            console.error('Error details:', error.response?.data);
            toast.error(`Failed to load packages: ${error.response?.data?.message || error.message}`);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const searchParams = {};
        if (destination.trim()) {
            searchParams.destination = destination.trim();
        }
        if (month) {
            searchParams.month = month;
        }
        
        loadPackages(searchParams);
    };

    const handleShowAll = () => {
        // Clear all search filters
        setDestination('');
        setMonth('');
        // Load all packages without any filters
        loadPackages();
    };

    const hasActiveFilters = destination.trim() || month;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const handleBookPackage = () => {
        setShowBookingModal(true);
    };

    const handleBookingComplete = (bookingResult) => {
        setShowBookingModal(false);
        setSelectedPackage(null);
        
        // Show success message with coupon info if available
        if (bookingResult.flight_discount_coupon) {
            toast.success(
                `Package booked successfully! 🎉\nYou've received a flight discount coupon: ${bookingResult.flight_discount_coupon.coupon_code}`,
                { duration: 6000 }
            );
        } else {
            toast.success('Package booked successfully! 🎉');
        }
    };

    const handlePackageSelect = async (packageId) => {
        try {
            const response = await api.get(`/packages/${packageId}`);
            if (response.data.success) {
                const packageDetails = response.data.package;
                // Filter modules into separate arrays
                const flights = packageDetails.modules.filter(m => m.module_type === 'flight');
                const hotels = packageDetails.modules.filter(m => m.module_type === 'accommodation');
                const activities = packageDetails.modules.filter(m => m.module_type === 'activity');

                setSelectedPackage({
                    // Keep original response data structure, but add filtered modules
                    ...response.data, 
                    package: packageDetails, // Ensure 'package' object is preserved
                    flights: flights,
                    hotels: hotels,
                    activities: activities
                });
            }
        } catch (error) {
            console.error('Error loading package details:', error);
            toast.error('Failed to load package details');
        }
    };

    return (
        <div className='space-y-6'>
            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Destination</label>
                    <input 
                        type="text" 
                        placeholder="e.g., Tokyo, Japan" 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Month</label>
                    <input 
                        type="month" 
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors dark-calendar-picker" 
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSearch} 
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        <span>{loading ? 'Searching...' : 'Search'}</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleShowAll} 
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {hasActiveFilters ? (
                            <>
                                <RotateCcw size={20} />
                                <span>Clear Filters</span>
                            </>
                        ) : (
                            <>
                                <Eye size={20} />
                                <span>Show All</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Active filters:</span>
                    {destination.trim() && (
                        <span className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full border border-purple-600/30">
                            Destination: {destination.trim()}
                        </span>
                    )}
                    {month && (
                        <span className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full border border-purple-600/30">
                            Month: {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </span>
                    )}
                </div>
            )}

            {/* Results */}
            {searchPerformed && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Package size={24} />
                            {hasActiveFilters ? 'Search Results' : 'Available Packages'} ({packages.length})
                        </h3>
                        {packages.length > 0 && hasActiveFilters && (
                            <button
                                onClick={handleShowAll}
                                className="text-sm text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
                            >
                                <Eye size={16} />
                                View all packages
                            </button>
                        )}
                    </div>

                    {packages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Package size={64} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">
                                {hasActiveFilters ? 'No packages found matching your criteria' : 'No packages available'}
                            </p>
                            <p className="text-sm">
                                {hasActiveFilters ? 'Try adjusting your search criteria or ' : 'Check back later for new packages'}
                                {hasActiveFilters && (
                                    <button 
                                        onClick={handleShowAll}
                                        className="text-purple-400 hover:text-purple-300 underline"
                                    >
                                        view all packages
                                    </button>
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {packages.map((pkg) => (
                                <div key={pkg.package_id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-200 cursor-pointer"
                                     onClick={() => handlePackageSelect(pkg.package_id)}>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-lg font-semibold text-white">{pkg.title}</h4>
                                            <span className="text-purple-400 font-bold text-xl">{formatPrice(pkg.price)}</span>
                                        </div>
                                        
                                        <p className="text-gray-300 text-sm line-clamp-2">{pkg.description}</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <MapPin size={16} />
                                                <span>{pkg.location_name}, {pkg.country}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Users size={16} />
                                                <span>Group size: {pkg.group_size}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar size={16} />
                                                <span>{formatDate(pkg.start_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar size={16} />
                                                <span>{formatDate(pkg.end_date)}</span>
                                            </div>
                                        </div>

                                        {pkg.creator_name && (
                                            <div className="text-xs text-gray-500">
                                                Created by {pkg.creator_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Package Details Modal */}
            {selectedPackage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-white">{selectedPackage.package.title}</h3>
                            <button 
                                onClick={() => setSelectedPackage(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Package Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Package Details</h4>
                                    <div className="space-y-2 text-sm text-gray-300">
                                        <p><strong>Destination:</strong> {selectedPackage.package.location_name}, {selectedPackage.package.country}</p>
                                        <p><strong>Start Date:</strong> {formatDate(selectedPackage.package.start_date)}</p>
                                        <p><strong>End Date:</strong> {formatDate(selectedPackage.package.end_date)}</p>
                                        <p><strong>Group Size:</strong> {selectedPackage.package.group_size}</p>
                                        <p><strong>Price:</strong> {formatPrice(selectedPackage.package.price)}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Description</h4>
                                    <p className="text-sm text-gray-300">{selectedPackage.package.description}</p>
                                </div>
                            </div>

                            {/* Flights */}
                            {selectedPackage.flights && selectedPackage.flights.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Included Flights</h4>
                                    <div className="space-y-3">
                                        {selectedPackage.flights.map((flight, index) => (
                                            <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-medium text-white">{flight.title}</h5>
                                                        <p className="text-sm text-gray-300">{flight.airline} - {flight.flight_number}</p>
                                                        <p className="text-sm text-gray-400">{flight.origin_name} → {flight.destination_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-purple-400 font-medium">{formatPrice(flight.price)}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {flight.included_by_default ? 'Included' : 'Optional'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hotels */}
                            {selectedPackage.hotels && selectedPackage.hotels.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Included Hotels</h4>
                                    <div className="space-y-3">
                                        {selectedPackage.hotels.map((hotel, index) => (
                                            <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-medium text-white">{hotel.title}</h5>
                                                        <p className="text-sm text-gray-300">{hotel.hotel_name}</p>
                                                        <p className="text-sm text-gray-400">Room: {hotel.room_type}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-purple-400 font-medium">{formatPrice(hotel.price)}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {hotel.included_by_default ? 'Included' : 'Optional'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Activities */}
                            {selectedPackage.activities && selectedPackage.activities.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Included Activities</h4>
                                    <div className="space-y-3">
                                        {selectedPackage.activities.map((activity, index) => (
                                            <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-medium text-white">{activity.title}</h5>
                                                        <p className="text-sm text-gray-300">{activity.activity_name}</p>
                                                        <p className="text-sm text-gray-400">Type: {activity.activity_type}</p>
                                                        {activity.duration_minutes && (
                                                            <p className="text-sm text-gray-400">Duration: {activity.duration_minutes} minutes</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-purple-400 font-medium">{formatPrice(activity.price)}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {activity.included_by_default ? 'Included' : 'Optional'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-700">
                                <button 
                                    onClick={handleBookPackage}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={20} />
                                    Book This Package
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Package Booking Modal */}
            {showBookingModal && selectedPackage && (
                <PackageBookingModal
                    packageData={selectedPackage}
                    onClose={() => setShowBookingModal(false)}
                    onBookingComplete={handleBookingComplete}
                />
            )}
        </div>
    );
}