import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function CommunityPostCreateModal({ open, onClose, user, communityId, onPostCreated, onTriggerSignIn }) {
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
    }
  }, [open, communityId]);

  async function handleCreatePost(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg("You must be signed in to post.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = { community_id: communityId, title: title.trim(), content: content.trim() };
      const response = await api.post('/community-posts', payload);
      onPostCreated(response.data.post);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Could not create post.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

    return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl shadow-purple-900/20 p-6 max-w-2xl w-full relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors" aria-label="Close modal"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-purple-400 mb-6">New Post in Community</h2>

        {/* Error message display remains the same */}
        
        <form onSubmit={handleCreatePost} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar" style={{ maxHeight: "calc(70vh - 150px)" }}>
          <div>
            <label htmlFor="communityPostTitle" className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input
              id="communityPostTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Post title..."
              required
              disabled={!user || loading}
            />
          </div>
          <div>
            <label htmlFor="communityPostContent" className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
            <textarea
              id="communityPostContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              rows={8}
              placeholder="Share your thoughts with the community..."
              required
              disabled={!user || loading}
            />
          </div>
        </form>
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          {/* Create Post button remains the same */}
           <button type="button" onClick={handleCreatePost} disabled={loading || !user}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="animate-spin" size={18}/> Posting...</> : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

