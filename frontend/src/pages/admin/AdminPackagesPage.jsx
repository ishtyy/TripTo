// src/pages/admin/AdminPackagesPage.jsx
import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { DynamicDataTable } from '../../components/admin/DynamicDataTable';
import CreatePackageModal from '../../components/admin/CreatePackageModal';
import EditPackageModal from '../../components/admin/EditPackageModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const packageColumns = [
    { header: 'Package Name', accessor: 'title', sortable: true }, // Changed from 'name' to 'title'
    { header: 'Destination', accessor: 'destination_name', sortable: true }, // Changed from 'destination' to 'destination_name'
    { header: 'Price', accessor: 'price', type: 'currency', sortable: true },
    { header: 'Start Date', accessor: 'start_date', type: 'date', sortable: true }, // Added start_date
    { header: 'End Date', accessor: 'end_date', type: 'date', sortable: true }, // Added end_date
    { header: 'Group Size', accessor: 'group_size', sortable: true }, // Added group_size
    { header: 'Creator', accessor: 'creator_name', sortable: true }, // Added creator
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true }, // Added created date
];

export default function AdminPackagesPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Handle package actions
    const handleAction = async (action, id, refreshCallback) => {
        try {
            switch (action) {
                case 'View':
                    // TODO: Implement view package details modal
                    toast.success(`Viewing package ${id}`);
                    break;
                case 'Edit':
                    console.log('Edit clicked for package ID:', id);
                    setEditingPackageId(id);
                    setIsEditModalOpen(true);
                    console.log('Modal state set to:', { editingPackageId: id, isEditModalOpen: true });
                    break;
                case 'Delete':
                    if (window.confirm('Are you sure you want to delete this package?')) {
                        await api.delete(`/admin/packages/${id}`);
                        toast.success('Package deleted successfully');
                        if (refreshCallback) refreshCallback();
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action.toLowerCase()} package`);
        }
    };

    const handlePackageCreated = () => {
        setRefreshKey(prev => prev + 1); // This will trigger a refresh of the DynamicDataTable
        setIsCreateModalOpen(false);
    };

    const handlePackageUpdated = () => {
        setRefreshKey(prev => prev + 1); // This will trigger a refresh of the DynamicDataTable
        setIsEditModalOpen(false);
        setEditingPackageId(null);
    };

    return (
        <div className="p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">Packages Management</h1>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg border-none cursor-pointer transition-all shadow-lg shadow-orange-500/40 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-orange-500/60"
                >
                    <PlusCircle size={20} />
                    <span>Create New Package</span>
                </button>
            </div>
            
            <DynamicDataTable
                key={refreshKey} // This will force re-render when packages are updated
                endpoint="/admin/packages" 
                columns={packageColumns}
                searchPlaceholder="Search by package name or destination..."
                itemKey="package_id"
                actions={[
                    { label: 'View', icon: <Eye size={18} />, action: (id, refresh) => handleAction('View', id, refresh) },
                    { label: 'Edit', icon: <Edit size={18} />, action: (id, refresh) => handleAction('Edit', id, refresh) },
                    { label: 'Delete', icon: <Trash2 size={18} />, action: (id, refresh) => handleAction('Delete', id, refresh) }
                ]}
            />

            <CreatePackageModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPackageCreated={handlePackageCreated}
            />

            <EditPackageModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingPackageId(null);
                }}
                onPackageUpdated={handlePackageUpdated}
                packageId={editingPackageId}
            />
        </div>
    );
}