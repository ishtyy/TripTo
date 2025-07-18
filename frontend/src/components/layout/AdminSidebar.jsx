// src/components/layout/AdminSidebar.jsx

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Package } from 'lucide-react';
import AdminTextLogo from './AdminTextLogo';

export default function AdminSidebar({ user, onSignOut }) {
    const navItems = [
        { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard }, // Changed from 'Dashboard'
        { path: 'users', label: 'Users Management', icon: Users }, // Changed from 'Users'
        { path: 'bookings', label: 'Bookings', icon: Briefcase },
        { path: 'packages', label: 'Packages', icon: Package },
        { path: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        // Sidebar: Now sticky and has its own scrollbar if content overflows.
        <aside className="w-64 bg-gray-900/70 border-r border-gray-800 backdrop-blur-md flex flex-col p-4 sticky top-0 h-screen overflow-y-auto">
            <div className="mb-8 flex justify-center">
                <AdminTextLogo />
                <span className="text-xs text-orange-400 ml-1">Admin Studio</span>
            </div>
            <nav className="flex-grow flex flex-col space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-lg font-medium no-underline transition-colors ${isActive ? 'bg-cyan-500 text-gray-900 font-semibold shadow-lg shadow-cyan-500/40' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-800">
                {user && (
                    <Link to={`/profile/${user.user_id}`} className="block no-underline rounded-lg mb-4 transition-colors hover:bg-white/5" title="View your profile">
                        <div className="flex items-center space-x-3 p-3">
                            <img
                                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=f97316&color=fff&size=40`}
                                alt="Admin Avatar"
                                className="w-10 h-10 rounded-full border-2 border-cyan-500"
                            />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-200">{user.username}</span>
                                <span className="text-sm text-gray-400">Administrator</span>
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
}