import React from 'react';
import { DynamicDataTable } from '../../components/Admin/DynamicDataTable';
import api from '../../services/api';
import { Trash2 } from 'lucide-react';

const postColumns = [
    { header: 'Title', accessor: 'title', sortable: true },
    { header: 'Author', accessor: 'author_name', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true },
];

const deletePost = (id) => api.delete(`/admin/posts/${id}`);

export default function AdminPostsPage() {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Blog Post Management</h1>
            <DynamicDataTable
                endpoint="/admin/posts"
                columns={postColumns}
                searchPlaceholder="Search posts by title or author..."
                itemKey="post_id"
                actions={[{ label: 'Delete Post', action: deletePost, icon: <Trash2 size={18} className="text-red-400"/> }]}
            />
        </div>
    );
}