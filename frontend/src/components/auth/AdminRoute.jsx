import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// ✅ FIX: Removed the incorrect import of a backend controller.
// This component now correctly receives user and loading status as props.
const AdminRoute = ({ user, loading }) => {
    
    // 1. If the app is still checking for a user, show a loading spinner.
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="animate-spin text-yellow-400" size={48} />
            </div>
        );
    }

    // 2. Once loading is complete, check if the user is an admin.
    // If not, redirect them to the admin login page.
    return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminRoute;