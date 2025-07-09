import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function CascadeModal({ open, onClose, originalPost, onCascadeCreated }) {
  const [title, setTitle] = useState(`Cascade: ${originalPost?.title || ''}`);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const handleCascadeSubmit = async () => {
    if (!content.trim() || !title.trim()) {
      setErrorMsg("Your title and thoughts are required.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = { title, content };
      await api.post(`/posts/${originalPost.post_id}/cascade`, payload);
      onCascadeCreated();
    } catch (err) {
      setErrorMsg("Failed to create Cascade. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl p-6 max-w-2xl w-full relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-purple-400 mb-4">Cascade Post</h2>
        
        <div className="mb-4 p-3 border border-gray-700 rounded-lg bg-gray-800/50">
            <p className="text-sm font-semibold text-gray-300 truncate">{originalPost.title}</p>
            <p className="text-xs text-gray-400 line-clamp-2">{originalPost.content}</p>
        </div>

        <div className="space-y-4">
            <div>
                <label htmlFor="cascadeTitle" className="block text-sm font-medium text-gray-300 mb-1.5">Your Title</label>
                <input id="cascadeTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-purple-500"/>
            </div>
            <div>
                <label htmlFor="cascadeContent" className="block text-sm font-medium text-gray-300 mb-1.5">Your Thoughts</label>
                <textarea id="cascadeContent" value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-purple-500 resize-none" rows={5} placeholder="Add your perspective..."/>
            </div>
        </div>
        
        {errorMsg && <p className="text-red-400 text-sm mt-3 text-center">{errorMsg}</p>}

        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          <button onClick={handleCascadeSubmit} disabled={loading} className="px-6 py-2.5 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18}/> : null}
            Cascade
          </button>
        </div>
      </div>
    </div>
  );
}