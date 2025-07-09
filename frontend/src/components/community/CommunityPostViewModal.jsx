import React from 'react';
import { X, User, Calendar } from 'lucide-react';

export default function ViewCommunityPostModal({ open, onClose, post }) {
  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl shadow-purple-900/20 p-6 md:p-8 max-w-3xl w-full relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>

        <h2 className="text-3xl md:text-4xl font-bold text-purple-300 break-words mb-4">
          {post.title}
        </h2>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-sm text-gray-400 border-b border-t border-gray-800 py-3">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-500" />
            <span>By: <span className="font-medium text-gray-300">{post.user_profile?.username || "Unknown"}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-gray-300">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="overflow-y-auto pr-2 text-gray-200 flex-grow custom-scrollbar">
          <article className="prose prose-lg prose-invert max-w-none leading-relaxed whitespace-pre-wrap">
            {post.content}
          </article>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
          <button type="button" onClick={onClose}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
