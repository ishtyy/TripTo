// frontend/src/components/ViewPostModal.jsx
import React from 'react';
import { X } from 'lucide-react';

export default function ViewPostModal({ open, onClose, post }) {
  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4"> {/* Higher z-index */}
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 md:p-8 relative flex flex-col shadow-xl max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl md:text-3xl font-heading mb-4 text-sky-300 break-words">
          {post.title}
        </h2>

        <div className="overflow-y-auto pr-2 text-gray-200 flex-grow">
          <div className="mb-4 text-sm text-gray-400 border-b border-gray-700 pb-3">
            <p>By: <span className="font-medium text-gray-300">{post.user_profile?.username || "Unknown User"}</span></p>
            {post.location && (
              <p>Location: <span className="text-gray-300">{post.location.location_name}{post.location.country ? `, ${post.location.country}` : ""}</span></p>
            )}
            <p>Posted: <span className="text-gray-300">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
          </div>
          
          {/* Using whitespace-pre-wrap to respect newlines and wrap text */}
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded bg-ocean hover:bg-ocean/90 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
