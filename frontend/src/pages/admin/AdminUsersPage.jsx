// Example for frontend/src/pages/admin/AdminUsersPage.jsx (Final Code)
import React from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import api from '../../services/api';
import { Trash2, UserCheck, UserX } from 'lucide-react';

const userColumns = [
    { header: 'Username', accessor: 'username', sortable: true },
    { header: 'Email', accessor: 'email', sortable: true },
    { header: 'Role', accessor: 'role', sortable: true },
    { header: 'Joined', accessor: 'created_at', type: 'date', sortable: true },
];

const updateUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export default function AdminUsersPage() {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
            <DynamicDataTable
                endpoint="/admin/users"
                columns={userColumns}
                searchPlaceholder="Search users by name or email..."
                itemKey="user_id"
                actions={[
                    { label: 'Promote to Admin', action: (id) => updateUserRole(id, 'admin'), icon: <UserCheck size={18} className="text-green-400"/> },
                    { label: 'Demote to User', action: (id) => updateUserRole(id, 'user'), icon: <UserX size={18} className="text-yellow-400"/> },
                    { label: 'Delete User', action: (id) => deleteUser(id), icon: <Trash2 size={18} className="text-red-400"/> },
                ]}
            />
        </div>
    );
}

// You would create similar files for AdminPostsPage, AdminCommunitiesPage, etc.