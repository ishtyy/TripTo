import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageSquare, GitBranch, Repeat } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// A sub-component for the embedded parent post (used for Cascades)
const QuotedPost = ({ post }) => (
    <div className="mt-3 p-3 border-l-4 border-purple-800 bg-gray-800/50 rounded-r-lg">
        <div className="text-sm text-gray-400 mb-1">
            Cascading from <span className="font-semibold text-purple-300">{post.author.username}</span>
        </div>
        <p className="text-gray-200 font-semibold truncate">{post.title}</p>
    </div>
);

export default function BlogPostCard({ post, user, onTriggerSignIn, onViewPost, onCascade }) {
    // Safely initialize vote counts to 0 if they are null
    const [localUpvotes, setLocalUpvotes] = useState(post.upvote_count ?? 0);
    const [localDownvotes, setLocalDownvotes] = useState(post.downvote_count ?? 0);
    const [userVote, setUserVote] = useState(post.user_vote); // This would be passed from a more complex query

    const handleVote = async (voteType) => {
        if (!user) {
            onTriggerSignIn();
            return;
        }

        const oldVote = userVote;
        const newVote = oldVote === voteType ? null : voteType;

        // Optimistically update the UI for instant feedback
        let upvoteChange = 0;
        let downvoteChange = 0;
        if (oldVote === 1) upvoteChange = -1;
        if (oldVote === -1) downvoteChange = -1;
        if (newVote === 1) upvoteChange = 1;
        if (newVote === -1) downvoteChange = 1;
        setLocalUpvotes(localUpvotes + upvoteChange);
        setLocalDownvotes(localDownvotes + downvoteChange);
        setUserVote(newVote);
        
        // Send the vote to the backend
        try {
            await api.post(`/posts/${post.post_id}/vote`, { vote_type: newVote });
        } catch (error) {
            toast.error("Vote could not be cast.");
            // Revert the UI on error
            setLocalUpvotes(localUpvotes);
            setLocalDownvotes(localDownvotes);
            setUserVote(oldVote);
        }
    };

    return (
        <div className="bg-gray-900/80 rounded-xl shadow-lg border-2 border-gray-800 transition-all duration-300 flex">
            {/* Voting Section */}
            <div className="flex flex-col items-center p-3 bg-gray-900/50 rounded-l-xl border-r border-gray-800">
                <button onClick={() => handleVote(1)} className={`p-2 rounded-full transition-colors ${userVote === 1 ? 'text-purple-400 bg-purple-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <ArrowUp size={20} />
                </button>
                <span className="font-bold text-lg my-1 text-white">{localUpvotes - localDownvotes}</span>
                <button onClick={() => handleVote(-1)} className={`p-2 rounded-full transition-colors ${userVote === -1 ? 'text-cyan-400 bg-cyan-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <ArrowDown size={20} />
                </button>
            </div>

            {/* Post Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                 <div className="flex items-center gap-3 text-sm mb-3">
                    <Link to={`/profile/${post.author_id}`}>
                        <img src={post.user_profile?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user_profile?.username)}&background=random`} alt={post.user_profile?.username} className="w-8 h-8 rounded-full bg-gray-700"/>
                    </Link>
                    <div>
                        <p className="font-semibold text-white">{post.user_profile?.username || "Unknown User"}</p>
                        <p className="text-xs text-gray-400">{post.location?.location_name || "Unknown Location"} · {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="cursor-pointer group flex-grow" onClick={() => onViewPost(post)}>
                    {post.parent_post && (
                        <div className="text-purple-300 text-xs font-semibold mb-2 flex items-center gap-1.5"><Repeat size={14} /><span>Cascade</span></div>
                    )}
                    <h3 className="font-bold text-xl text-white group-hover:text-purple-300 transition-colors">{post.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-3">{post.content}</p>
                    {post.parent_post && <QuotedPost post={post.parent_post} />}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/50 flex items-center gap-6 text-sm">
                    <button onClick={() => onViewPost(post)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <MessageSquare size={16} />
                        <span>{post.comment_count || 0} Comments</span>
                    </button>
                    <button onClick={() => onCascade(post)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <GitBranch size={16} />
                        <span>{post.cascade_count || 0} Cascades</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
