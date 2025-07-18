// TripTo2/frontend/src/pages/admin/AdminUsersPage.jsx

import React, { useState } from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import { Eye, UserPlus, Pencil, Trash2, ShieldQuestion, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import api from '../../services/api';

export default function AdminUsersPage() {
    const [modalState, setModalState] = useState({ confirmOpen: false, selectedId: null, action: null });

    const handleAction = (type, id, refresh) => {
        setModalState({ ...modalState, confirmOpen: true, action: { type, id, refresh } });
    };

    const confirmAction = async () => {
        const { type, id, refresh } = modalState.action;
        if (!type || !id) return;

        try {
            if (type === 'delete') {
                await api.delete(`/admin/users/${id}`);
            } else {
                await api.put(`/admin/users/${id}/status`, { status: type }); // Assuming a generic status update endpoint
            }
            toast.success(`User ${type}d successfully!`);
            if (refresh) refresh();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${type} user.`);
        } finally {
            setModalState({ ...modalState, confirmOpen: false, action: null });
        }
    };

    const userColumns = [
        { header: 'User ID', accessor: 'user_id' },
        { header: 'Username', accessor: 'username' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role' },
        { header: 'Status', accessor: 'status', type: 'status' },
        { header: 'Joined On', accessor: 'created_at', type: 'date' },
    ];

    const userActions = [
        // { label: 'View Details', icon: <Eye size={18} className="text-blue-400" />, action: (id) => console.log('View user', id) },
        // { label: 'Edit', icon: <Pencil size={18} className="text-orange-400" />, action: (id) => console.log('Edit user', id) },
        { label: 'Activate', icon: <CheckCircle size={18} className="text-green-400" />, action: (id, r) => handleAction('active', id, r), isVisible: row => row.status === 'inactive' || row.status === 'banned' },
        { label: 'Deactivate', icon: <Ban size={18} className="text-yellow-400" />, action: (id, r) => handleAction('inactive', id, r), isVisible: row => row.status === 'active' },
        { label: 'Ban', icon: <Ban size={18} className="text-red-400" />, action: (id, r) => handleAction('banned', id, r), isVisible: row => row.status !== 'banned' },
        { label: 'Delete', icon: <Trash2 size={18} className="text-gray-400" />, action: (id, r) => handleAction('delete', id, r) },
    ];

    return (
        <div className="p-8 animate-fadeIn">
            {/* Removed the redundant h1 tag */}
            <DynamicDataTable
                endpoint="/admin/users"
                columns={userColumns}
                itemKey="user_id"
                actions={userActions}
            />
            <ConfirmationModal
                isOpen={modalState.confirmOpen}
                onClose={() => setModalState({ ...modalState, confirmOpen: false })}
                onConfirm={confirmAction}
                title="Confirm Action"
                message={`Are you sure you want to ${modalState.action?.type} this user?`}
            />
        </div>
    );
}