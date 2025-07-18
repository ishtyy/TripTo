import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Bell, Inbox } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import SearchBar from './SearchBar';

export default function Header({ user, onSignOut, onTriggerSignIn, onTriggerSignUp }) {
    // CORRECTED: The function from the context is `openBookingModal`.
    const { cart, openBookingModal } = useBooking();

    return (
        <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-2 grid grid-cols-3 items-center sticky top-0 z-50 backdrop-blur-sm">
            <div className="flex justify-start">
                {/* This space is intentionally left empty to prevent the duplicate logo. */}
                {/* The main logo is likely handled in your Layout.jsx or App.jsx file. */}
            </div>

            <SearchBar />

            <div className="flex justify-end items-center space-x-6">
                {/* Itinerary / Shopping Cart Button */}
                <button 
                    // CORRECTED: This now correctly calls the function to open the modal.
                    onClick={() => openBookingModal('cart')} 
                    className="relative text-gray-400 hover:text-cyan-300 transition-colors"
                    title="View Itinerary"
                >
                    <ShoppingCart size={22} />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.length}
                        </span>
                    )}
                </button>

                {/* User Authentication Section */}
                {user ? (
                    <>
                        <Link to="/messages" title="Inbox" className="text-gray-400 hover:text-cyan-300">
                            <Inbox size={22} />
                        </Link>
                        <button title="Notifications" className="text-gray-400 hover:text-cyan-300">
                            <Bell size={22} />
                        </button>
                        <Link to={`/profile/${user.user_id}`} title="View Profile">
                            <img 
                                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=22d3ee&color=000&size=36`} 
                                alt="User Avatar" 
                                className="w-9 h-9 rounded-full border-2 border-cyan-500"
                            />
                        </Link>
                    </>
                ) : (
                    <div className="flex items-center gap-4">
                        <button onClick={onTriggerSignIn} className="font-semibold text-gray-300 hover:text-cyan-400 transition-colors">Sign In</button>
                        <button onClick={onTriggerSignUp} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">Sign Up</button>
                    </div>
                )}
            </div>
        </header>
    );
}