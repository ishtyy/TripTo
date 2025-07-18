// src/components/Admin/AdminSidebar.jsx

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Package } from 'lucide-react'; // Added Package icon
import AdminTextLogo from './AdminTextLogo';

export default function AdminSidebar({ user, onSignOut }) {
    // UPDATED Navigation Items
    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: 'users', label: 'Users', icon: Users },
        { path: 'bookings', label: 'Bookings', icon: Briefcase }, // Consolidated bookings
        { path: 'packages', label: 'Packages', icon: Package },   // New packages link
        { path: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <aside className="w-64 bg-gray-900/80 border-r border-gray-800 flex flex-col p-4 h-screen sticky top-0">
            <div className="p-4 mb-6 text-center">
                <AdminTextLogo />
                <span className="text-xs text-orange-400 ml-1">Admin Studio</span>
            </div>
            <nav className="flex flex-col space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                isActive ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-800">
                {user && (
                     <Link to={`/profile/${user.user_id}`} className="user-profile-link" title="View your profile">
                        <div className="user-profile">
                            <img
                                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=f97316&color=fff&size=40`}
                                alt="Admin Avatar"
                                className="avatar"
                            />
                            <div className="user-info">
                                <span className="username">{user.username}</span>
                                <span className="role">Administrator</span>
                            </div>
                        </div>
                    </Link>
                )}
                <button
                    onClick={onSignOut}
                    className="flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-gray-400 hover:bg-red-900/50 hover:text-red-400"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};