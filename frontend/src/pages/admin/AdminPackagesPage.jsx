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
        <div className="p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">Packages Management</h1>
                <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg border-none cursor-pointer transition-all shadow-lg shadow-orange-500/40 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-orange-500/60">
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