import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicDataTable } from '../../components/admin/DynamicDataTable';
import api from '../../services/api';
import { Trash2, ExternalLink } from 'lucide-react';

const communityColumns = [
    { header: 'Name', accessor: 'community_name', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true },
];

const deleteCommunity = (id) => api.delete(`/admin/communities/${id}`);

export default function AdminCommunitiesPage() {
    const navigate = useNavigate();

    const handleViewCommunity = (communityId) => {
        navigate(`/communities/${communityId}`);
    };

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Community Management</h1>
            <DynamicDataTable
                endpoint="/admin/communities"
                columns={communityColumns}
                searchPlaceholder="Search communities by name..."
                itemKey="community_id"
                actions={[
                    { label: 'View Community', action: handleViewCommunity, icon: <ExternalLink size={18} className="text-blue-400"/> },
                    { label: 'Delete Community', action: deleteCommunity, icon: <Trash2 size={18} className="text-red-400"/> }
                ]}
            />
        </div>
    );
}