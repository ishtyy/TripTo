import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
// IMPORT PATHS FIXED: Corrected paths to be relative to the 'layout' folder
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

// This helper function gets the title from the URL (e.g., "/admin/users" -> "Users")
const getTitleFromPath = (path) => {
    const segment = path.split('/').pop();
    if (!segment || segment === 'admin') return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
};

export default function AdminLayout({ user, onSignOut }) {
    const location = useLocation();
    const currentPageTitle = getTitleFromPath(location.pathname);

    return (
        <div className="admin-layout-container">
            <AdminSidebar user={user} onSignOut={onSignOut} />
            <div className="admin-main-content-area">
                <AdminHeader title={currentPageTitle} user={user} />
                <main className="admin-page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}