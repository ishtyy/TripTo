import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageSquare, GitBranch, Repeat, Tag } from 'lucide-react';
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
    const navigate = useNavigate();
    
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
        <div className="bg-gray-900/80 rounded-xl shadow-lg border-2 border-gray-800 transition-all duration-300 hover:border-gray-700">
            {/* Post Content Section */}
            <div className="p-5 flex flex-col">
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

                {/* Tags Section */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const tagName = typeof tag === 'string' ? tag : tag.tag_name;
                                    navigate(`/explore?tag=${encodeURIComponent(tagName)}`);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 hover:text-purple-200 text-xs rounded-full border border-purple-700/50 hover:border-purple-600 transition-all duration-200"
                            >
                                <Tag size={12} />
                                {typeof tag === 'string' ? tag : tag.tag_name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Interaction Section */}
                <div className="mt-4 pt-3 border-t border-gray-800/50 flex items-center justify-between">
                    {/* Left side - Vote buttons */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-800/50 rounded-full border border-gray-700">
                            <button onClick={() => handleVote(1)} className={`p-2 rounded-l-full transition-colors ${userVote === 1 ? 'text-purple-400 bg-purple-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                                <ArrowUp size={18} />
                            </button>
                            <span className="font-bold text-sm px-3 text-white min-w-[3rem] text-center">{localUpvotes - localDownvotes}</span>
                            <button onClick={() => handleVote(-1)} className={`p-2 rounded-r-full transition-colors ${userVote === -1 ? 'text-cyan-400 bg-cyan-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                                <ArrowDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right side - Action buttons */}
                    <div className="flex items-center gap-4 text-sm">
                        <button onClick={() => onViewPost(post)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <MessageSquare size={16} />
                            <span>{post.comment_count || 0}</span>
                        </button>
                        <button onClick={() => onCascade(post)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <GitBranch size={16} />
                            <span>{post.cascade_count || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
