import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function CommunityPostCreateModal({ open, onClose, communityId, user, onPostCreated }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            return toast.error("A title is required.");
        }
        setLoading(true);
        try {
            const { data } = await api.post('/community-posts', {
                community_id: communityId,
                title: title.trim(),
                content: content.trim()
            });
            toast.success("Post created successfully!");
            onPostCreated(data);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };
    
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl animate-slide-up-fast" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Create Post</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-circle"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <input
                            type="text"
                            placeholder="Post Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            // ✅ FIX: Using the consistent dark-themed input style
                            className="input-primary w-full text-lg" 
                        />
                        <textarea
                            placeholder="Share your story... (optional)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                             // ✅ FIX: Using the consistent dark-themed input style
                            className="input-primary w-full min-h-[150px] resize-y"
                        />
                    </div>
                    <div className="p-4 bg-gray-800/50 border-t border-gray-800 flex justify-end items-center space-x-3">
                        <button type="button" className="btn btn-ghost"><ImageIcon size={20} /></button>
                        <button 
                            type="submit" 
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-5 rounded-lg transition-all disabled:opacity-50" 
                            disabled={loading || !title.trim()}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}