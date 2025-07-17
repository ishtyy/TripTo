import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ user, onSignOut }) {
    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <AdminSidebar user={user} onSignOut={onSignOut} />
            <main className="flex-1 overflow-y-auto bg-dots">
                <Outlet />
            </main>
        </div>
    );
}