// frontend/src/components/ViewCommunityPostModal.jsx
import React from 'react';
import { X, User } from 'lucide-react'; // Added User icon

export default function ViewCommunityPostModal({ open, onClose, post }) {
  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[90] p-4 transition-opacity duration-300 ease-in-out"> {/* Higher z-index, smooth transition */}
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl p-6 md:p-8 relative flex flex-col shadow-2xl max-h-[90vh] border border-gray-700 transform transition-all duration-300 ease-in-out scale-95 group-hover:scale-100"> {/* Enhanced styling */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-sky-400 transition-colors p-1 rounded-full hover:bg-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl md:text-3xl font-heading mb-3 text-sky-300 break-words border-b border-gray-700 pb-3">
          {post.title}
        </h2>

        <div className="overflow-y-auto pr-2 text-gray-200 flex-grow custom-scrollbar"> {/* Added custom-scrollbar class */}
          <div className="mb-4 text-sm text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center">
              <User size={14} className="mr-1.5 text-gray-500" />
              <span>By: <span className="font-medium text-gray-300">{post.user_profile?.username || "Unknown User"}</span></span>
            </div>
            <span className="text-gray-500">
              Posted: <span className="text-gray-300">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </div>
          
          <article className="prose prose-sm prose-invert max-w-none leading-relaxed whitespace-pre-wrap"> {/* Tailwind typography, adjust as needed */}
            {post.content}
          </article>
        </div>

        {/* Optional: Add section for comments or actions here */}

        <div className="mt-6 pt-4 border-t border-gray-700 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
