import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const getTitleFromPath = (path) => {
    const segment = path.split('/').pop();
    if (!segment || segment === 'admin') return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
};

export default function AdminLayout({ user, onSignOut }) {
    const location = useLocation();
    const currentPageTitle = getTitleFromPath(location.pathname);

    return (
        // Main layout container: flexbox to arrange sidebar and content side-by-side
        // min-h-screen ensures it takes full viewport height
        <div className="flex min-h-screen bg-[#111827] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:25px_25px] text-gray-200">
            {/* AdminSidebar is a direct child and will occupy its specified width */}
            <AdminSidebar user={user} onSignOut={onSignOut} />
            
            {/* Main content area: takes remaining space (flex-1), is a flex column, and handles its own scrolling (overflow-y-auto) */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                <AdminHeader title={currentPageTitle} user={user} />
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}