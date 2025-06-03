// frontend/src/components/CreateCommunityPostModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

export default function CreateCommunityPostModal({ open, onClose, user, communityId, onPostCreated, onTriggerSignIn }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setContent('');
      setLoading(false);
      setErrorMsg('');
      console.log("[CreateCommunityPostModal] Opened for communityId:", communityId, "User:", user);
    }
  }, [open, communityId]); // Reset when opened or communityId changes (though latter unlikely while open)

  async function handleCreatePost(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg("You must be signed in to post.");
      if (typeof onTriggerSignIn === 'function') {
        // onClose(); // Optionally close this modal first
        // onTriggerSignIn();
      }
      return;
    }
    if (!communityId) {
        setErrorMsg("Community context is missing. Cannot create post.");
        return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        community_id: communityId,
        title: title.trim(),
        content: content.trim(),
      };
      // Uses the new endpoint /api/community-posts
      const response = await api.post('/community-posts', payload);
      
      if (typeof onPostCreated === 'function') {
        onPostCreated(response.data.post);
      }
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Create Community Post Error:", err.response || err.message);
      setErrorMsg(err.response?.data?.error || "Could not create post. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const showSignInMessage = !user && open;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[80] p-4"> {/* Ensure high z-index */}
      <div className="bg-gray-800 rounded-lg w-full max-w-xl p-6 relative flex flex-col shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close modal">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-heading mb-6 text-gray-100">New Post in Community</h2>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}
        {showSignInMessage && (
           <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            Please <button onClick={() => { if (typeof onTriggerSignIn === 'function') { onClose(); onTriggerSignIn(); }}} className="font-bold underline hover:text-yellow-800">sign in</button> to post.
          </div>
        )}

        <form onSubmit={handleCreatePost} className="flex-1 overflow-y-auto space-y-5 pr-2" style={{ maxHeight: "calc(70vh - 150px)" }}>
          <div>
            <label htmlFor="communityPostTitle" className="block text-sm font-medium text-gray-200 mb-1">Title</label>
            <input
              id="communityPostTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-gray-600"
              placeholder="Post title..."
              required
              disabled={!user || loading}
            />
          </div>
          <div>
            <label htmlFor="communityPostContent" className="block text-sm font-medium text-gray-200 mb-1">Content</label>
            <textarea
              id="communityPostContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-gray-600"
              rows={6}
              placeholder="Share something with the community..."
              required
              disabled={!user || loading}
            />
          </div>
        </form>
        <div className="mt-6 pt-4 border-t border-gray-700 text-right">
          <button
            type="button"
            onClick={handleCreatePost}
            disabled={loading || !user}
            className={`px-5 py-2.5 rounded font-medium transition-colors ${
              (loading || !user) ? "bg-gray-500 cursor-not-allowed text-gray-300" : "bg-sunset hover:bg-sunset/80 text-white"
            }`}
          >
            {loading ? "Posting…" : "Create Community Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
