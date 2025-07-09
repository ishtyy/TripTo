import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, User, MapPin, Calendar, ArrowUp, ArrowDown, Repeat } from 'lucide-react';
import api from '../../services/api';
import CascadeModal from './CascadeModal';

const QuotedPost = ({ post }) => (
    <div className="mt-4 mb-6 p-3 border-l-4 border-purple-800 bg-gray-800/50 rounded-r-lg">
        <div className="text-sm text-gray-400 mb-1">
            Cascading from <Link to={`/profile/${post.author?.user_id}`} className="font-semibold text-purple-300 hover:underline">{post.author?.username || 'Unknown'}</Link>
        </div>
        <p className="text-gray-200 font-semibold truncate">{post.title}</p>
    </div>
);

export default function ViewPostModal({ open, onClose, post, loggedInUser }) {
    const [votes, setVotes] = useState({ up: 0, down: 0 });
    const [isCascadeModalOpen, setIsCascadeModalOpen] = useState(false);

    useEffect(() => {
        if (post) {
            setVotes({ up: post.upvote_count || 0, down: post.downvote_count || 0 });
        }
    }, [post]);

    if (!open || !post) return null;

    const handleVote = async (voteType) => {
        if (!loggedInUser) {
            alert("You must be signed in to vote.");
            return;
        }
        try {
            const res = await api.post(`/posts/${post.post_id}/vote`, { vote_type: voteType });
            setVotes({ up: res.data.upvote_count, down: res.data.downvote_count });
        } catch (error) {
            alert("An error occurred while voting. You may need to sign in again.");
        }
    };
    
    const openCascadeModal = () => {
        if (!loggedInUser) {
            alert("You must be signed in to cascade a post.");
            return;
        }
        setIsCascadeModalOpen(true);
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl p-6 md:p-8 max-w-3xl w-full relative flex flex-col max-h-[90vh]">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                    <h2 className="text-3xl md:text-4xl font-bold text-purple-300 break-words mb-4">{post.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-sm text-gray-400 border-b border-t border-gray-800 py-3">
                        <div className="flex items-center gap-2">
                            <User size={14} /><Link to={`/profile/${post.author_id}`} className="font-medium text-cyan-400 hover:underline">{post.user_profile?.username || "Unknown"}</Link>
                        </div>
                        {post.location && ( <div className="flex items-center gap-2"><MapPin size={14} /><span>{post.location.location_name}, {post.location.country}</span></div> )}
                        <div className="flex items-center gap-2"><Calendar size={14} /><span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    </div>
                    <div className="overflow-y-auto pr-2 text-gray-200 flex-grow custom-scrollbar">
                        {post.parent_post && <QuotedPost post={post.parent_post} />}
                        <article className="prose prose-lg prose-invert max-w-none leading-relaxed whitespace-pre-wrap">{post.content}</article>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleVote(1)} disabled={!loggedInUser} className="p-2 rounded-full bg-gray-800 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors disabled:hover:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed" title={!loggedInUser ? "Sign in to vote" : "Upvote"}><ArrowUp size={20} /></button>
                            <span className="font-bold text-white w-8 text-center">{votes.up - votes.down}</span>
                            <button onClick={() => handleVote(-1)} disabled={!loggedInUser} className="p-2 rounded-full bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:hover:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed" title={!loggedInUser ? "Sign in to vote" : "Downvote"}><ArrowDown size={20} /></button>
                            <button onClick={openCascadeModal} disabled={!loggedInUser} className="flex items-center gap-2 ml-4 px-4 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed" title={!loggedInUser ? "Sign in to Cascade" : "Cascade"}><Repeat size={16}/>Cascade</button>
                        </div>
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">Close</button>
                    </div>
                </div>
            </div>
            
            {loggedInUser && <CascadeModal open={isCascadeModalOpen} onClose={() => setIsCascadeModalOpen(false)} originalPost={post} onCascadeCreated={onClose} />}
        </>
    );
}