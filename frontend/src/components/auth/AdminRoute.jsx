import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ user, loading }) => {
    console.log("AdminRoute render - User:", user, "Loading:", loading, "User role:", user?.role); // Debug log
    
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="animate-spin text-yellow-400" size={48} />
            </div>
        );
    }
    return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminRoute;