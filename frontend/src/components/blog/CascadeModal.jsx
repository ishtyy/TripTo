import React from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, GitBranch } from 'lucide-react';

const OriginalPostQuote = ({ post }) => (
    <div className="p-3 border-l-4 border-gray-700 bg-gray-800/50 rounded-r-lg">
        <p className="text-sm font-semibold text-gray-300 truncate">{post.title}</p>
        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{post.content}</p>
    </div>
);

export default function CascadeModal({ open, onClose, parentPost, user, onTriggerSignIn, onPostCreated }) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

    // ✅ FIX: This guard clause prevents the component from rendering if the necessary props are missing.
    // This is the definitive fix for the "Cannot read properties of undefined" crash.
    if (!open || !parentPost) {
        return null;
    }

    const onSubmit = async (data) => {
        if (!user) {
            onTriggerSignIn();
            return;
        }
        try {
            await api.post(`/posts/${parentPost.post_id}/cascade`, {
                title: data.title,
                content: data.content,
            });
            toast.success('Successfully cascaded post!');
            if(onPostCreated) onPostCreated(); // Refresh the feed
            reset();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cascade post.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <GitBranch className="text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Create a Cascade</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <p className="text-sm text-gray-400 mb-4">You are cascading the following post:</p>
                    <OriginalPostQuote post={parentPost} />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                        <div>
                            <label htmlFor="cascade-title" className="block text-sm font-medium text-gray-300">Your Title</label>
                            <input
                                id="cascade-title"
                                {...register('title', { required: 'A title is required.' })}
                                className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500"
                                placeholder="e.g., My thoughts on this..."
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="cascade-content" className="block text-sm font-medium text-gray-300">Your Content</label>
                            <textarea
                                id="cascade-content"
                                {...register('content', { required: 'Content is required.' })}
                                rows="6"
                                className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500"
                                placeholder="Share your perspective..."
                            />
                            {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>}
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Posting...' : 'Post Cascade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
