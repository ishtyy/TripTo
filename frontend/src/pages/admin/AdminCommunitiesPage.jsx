import React from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import api from '../../services/api';
import { Trash2 } from 'lucide-react';

const communityColumns = [
    { header: 'Name', accessor: 'community_name', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true },
];

const deleteCommunity = (id) => api.delete(`/admin/communities/${id}`);

export default function AdminCommunitiesPage() {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Community Management</h1>
            <DynamicDataTable
                endpoint="/admin/communities"
                columns={communityColumns}
                searchPlaceholder="Search communities by name..."
                itemKey="community_id"
                actions={[{ label: 'Delete Community', action: deleteCommunity, icon: <Trash2 size={18} className="text-red-400"/> }]}
            />
        </div>
    );
}