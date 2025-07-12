import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageSquare, GitBranch, Repeat } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuotedPost = ({ post }) => (
    <div className="mt-4 p-3 border-l-4 border-gray-700 bg-gray-800/50 rounded-r-lg cursor-pointer hover:bg-gray-800 transition-colors">
        <div className="text-sm text-gray-400 mb-1">
            Cascading from <span className="font-semibold text-purple-300">{post.author?.username || "Unknown"}</span>
        </div>
        <p className="text-gray-200 font-semibold truncate">{post.title}</p>
    </div>
);

export default function BlogPostCard({ post, user, onTriggerSignIn, onViewPost, onCascade, animationDelay = 0 }) {
    // ✅ FIX: Safely initialize vote counts to 0 if they are null or undefined.
    const [localUpvotes, setLocalUpvotes] = useState(post.upvote_count ?? 0);
    const [localDownvotes, setLocalDownvotes] = useState(post.downvote_count ?? 0);
    const [userVote, setUserVote] = useState(post.user_vote);

    const handleVote = async (e, voteType) => {
        e.stopPropagation(); // Prevents the main card click from firing
        if (!user) {
            onTriggerSignIn();
            return;
        }

        const oldVote = userVote;
        const newVote = oldVote === voteType ? null : voteType;

        // --- Optimistic UI Update ---
        let newUpvotes = Number(localUpvotes) || 0;
        let newDownvotes = Number(localDownvotes) || 0;

        if (oldVote === 1) newUpvotes--;
        if (oldVote === -1) newDownvotes--;
        if (newVote === 1) newUpvotes++;
        if (newVote === -1) newDownvotes++;

        setLocalUpvotes(newUpvotes);
        setLocalDownvotes(newDownvotes);
        setUserVote(newVote);
        
        try {
            await api.post(`/posts/${post.post_id}/vote`, { vote_type: newVote });
        } catch (error) {
            toast.error("Vote could not be cast.");
            // Revert UI on error
            setLocalUpvotes(post.upvote_count ?? 0);
            setLocalDownvotes(post.downvote_count ?? 0);
            setUserVote(oldVote);
        }
    };

    return (
        <div 
            className="bg-gray-900/80 rounded-xl shadow-lg border-2 border-gray-800 transition-all duration-300 flex animate-fade-in-up"
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Voting Section */}
            <div className="flex flex-col items-center p-3 bg-gray-900/50 rounded-l-xl border-r border-gray-800">
                <button onClick={(e) => handleVote(e, 1)} className={`p-2 rounded-full transition-colors ${userVote === 1 ? 'text-purple-400 bg-purple-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <ArrowUp size={20} />
                </button>
                <span className="font-bold text-lg my-1 text-white">{localUpvotes - localDownvotes}</span>
                <button onClick={(e) => handleVote(e, -1)} className={`p-2 rounded-full transition-colors ${userVote === -1 ? 'text-cyan-400 bg-cyan-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <ArrowDown size={20} />
                </button>
            </div>

            {/* Post Content Section */}
            <div className="p-5 flex-1 flex flex-col cursor-pointer" onClick={() => onViewPost(post)}>
                 <div className="flex items-center gap-3 text-sm mb-3">
                    <Link to={`/profile/${post.author_id}`} onClick={(e) => e.stopPropagation()}>
                        <img src={post.user_profile?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user_profile?.username)}&background=random`} alt={post.user_profile?.username} className="w-9 h-9 rounded-full bg-gray-700"/>
                    </Link>
                    <div>
                        <Link to={`/profile/${post.author_id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-white hover:underline">{post.user_profile?.username || "Unknown User"}</Link>
                        <p className="text-xs text-gray-400">{post.location?.location_name || "Unknown Location"} · {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="group flex-grow">
                    {post.parent_post && (
                        <div className="text-purple-300 text-xs font-semibold mb-2 flex items-center gap-1.5"><Repeat size={14} /><span>Cascade</span></div>
                    )}
                    <h3 className="font-bold text-xl text-white group-hover:text-purple-300 transition-colors">{post.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-3">{post.content}</p>
                    {post.parent_post && <QuotedPost post={post.parent_post} />}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/50 flex items-center gap-6 text-sm">
                    <button onClick={(e) => { e.stopPropagation(); onViewPost(post); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <MessageSquare size={16} />
                        <span>{post.comment_count || 0} Comments</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onCascade(post); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <GitBranch size={16} />
                        <span>{post.cascade_count || 0} Cascades</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
