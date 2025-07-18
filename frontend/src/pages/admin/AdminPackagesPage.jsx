// src/pages/admin/AdminPackagesPage.jsx

import React from 'react';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';

const packageColumns = [
    { header: 'Package Name', accessor: 'name', sortable: true },
    { header: 'Destination', accessor: 'destination', sortable: true },
    { header: 'Price', accessor: 'price', type: 'currency', sortable: true },
    { header: 'Duration (Days)', accessor: 'duration', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true },
];

// Placeholder function for future implementation
const handleAction = (action, id) => {
    alert(`${action} package with ID: ${id}`);
};

export default function AdminPackagesPage() {
    return (
        <div className="vibrant-admin-page">
            <div className="page-header">
                <h1 className="page-title">Packages Management</h1>
                <button className="add-new-btn">
                    <PlusCircle size={20} />
                    <span>Create New Package</span>
                </button>
            </div>
            
            <DynamicDataTable
                endpoint="/admin/packages" // Assuming this will be your API endpoint
                columns={packageColumns}
                searchPlaceholder="Search by package name or destination..."
                itemKey="package_id"
                actions={[
                    { label: 'View', icon: <Eye size={18} />, action: (id) => handleAction('View', id) },
                    { label: 'Edit', icon: <Edit size={18} />, action: (id) => handleAction('Edit', id) },
                    { label: 'Delete', icon: <Trash2 size={18} />, action: (id) => handleAction('Delete', id) }
                ]}
            />
        </div>
    );
}