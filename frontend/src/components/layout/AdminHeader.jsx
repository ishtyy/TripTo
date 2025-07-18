// src/components/Admin/AdminHeader.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function AdminHeader({ title, user }) {
    return (
        <header className="p-6 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex justify-between items-center sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-gray-200">{title}</h1>
            <div className="flex items-center space-x-6">
                <button className="bg-transparent border-none text-gray-400 cursor-pointer transition-colors hover:text-cyan-400">
                    <Bell size={22} />
                </button>
                {user && (
                    <Link to={`/profile/${user.user_id}`} className="block">
                        <img
                            src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=fff&color=111827&size=36`}
                            alt="User Avatar"
                            className="w-9 h-9 rounded-full"
                        />
                    </Link>
                )}
            </div>
        </header>
    );
}