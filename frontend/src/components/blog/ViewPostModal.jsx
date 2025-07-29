import React, { useState, useEffect } from 'react';
import { X, Send, ArrowUp, ArrowDown, MessageSquare, GitBranch } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// A dedicated component to display a single comment
const Comment = ({ comment }) => (
    <div className="flex items-start gap-3">
        <img 
            src={comment.user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.username)}&background=random`} 
            alt={comment.user.username} 
            className="w-9 h-9 rounded-full bg-gray-700"
        />
        <div className="flex-1 bg-gray-800 rounded-lg p-3">
            <div className="flex items-baseline gap-2">
                <p className="font-semibold text-white">{comment.user.username}</p>
                <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
        </div>
    </div>
);

export default function ViewPostModal({ open, onClose, post, loggedInUser, onTriggerSignIn, onCascade }) {
    const [localUpvotes, setLocalUpvotes] = useState(0);
    const [localDownvotes, setLocalDownvotes] = useState(0);
    const [userVote, setUserVote] = useState(null);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    // This effect runs whenever a new post is opened in the modal.
    useEffect(() => {
        if (open && post?.post_id) {
            // Reset state for the new post to prevent showing old data
            setLocalUpvotes(post.upvote_count ?? 0);
            setLocalDownvotes(post.downvote_count ?? 0);
            setUserVote(post.user_vote);
            
            // Fetch comments for the newly opened post
            setLoadingComments(true);
            api.get(`/posts/${post.post_id}/comments`)
                .then(res => setComments(res.data || []))
                .catch(err => console.error("Failed to fetch comments", err))
                .finally(() => setLoadingComments(false));
        }
    }, [open, post]);

    const handleVote = async (voteType) => {
        if (!loggedInUser) {
            onTriggerSignIn();
            return;
        }

        const oldVote = userVote;
        const newVote = oldVote === voteType ? null : voteType;

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

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const { data: createdComment } = await api.post(`/posts/${post.post_id}/comments`, { content: newComment });
            setComments(prevComments => [...prevComments, createdComment]);
            setNewComment('');
        } catch (error) {
            toast.error("Failed to post comment.");
        }
    };

    if (!open || !post) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3 text-sm">
                        <Link to={`/profile/${post.author_id}`} onClick={onClose}>
                            <img src={post.user_profile?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user_profile?.username)}&background=random`} alt={post.user_profile?.username} className="w-10 h-10 rounded-full bg-gray-700"/>
                        </Link>
                        <div>
                            <Link to={`/profile/${post.author_id}`} onClick={onClose} className="font-semibold text-white hover:underline">{post.user_profile?.username || "Unknown User"}</Link>
                            <p className="text-xs text-gray-400">{post.location?.location_name || "Unknown Location"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="p-5 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-white mb-3">{post.title}</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>

                    <div className="mt-6 pt-4 border-t border-gray-800/50 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleVote(1)} className={`flex items-center gap-1.5 p-1.5 rounded-md transition-colors ${userVote === 1 ? 'text-purple-400 bg-purple-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                                <ArrowUp size={16} /> <span className="font-semibold">{localUpvotes}</span>
                            </button>
                            <button onClick={() => handleVote(-1)} className={`flex items-center gap-1.5 p-1.5 rounded-md transition-colors ${userVote === -1 ? 'text-cyan-400 bg-cyan-900/50' : 'text-gray-400 hover:bg-gray-700'}`}>
                                <ArrowDown size={16} /> <span className="font-semibold">{localDownvotes}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <MessageSquare size={16} />
                            <span>{comments.length} Comments</span>
                        </div>
                        <button onClick={() => { onClose(); onCascade(post); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <GitBranch size={16} />
                            <span>{post.cascade_count || 0} Cascades</span>
                        </button>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-white mb-4">Comments</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {loadingComments ? <p className="text-gray-400">Loading comments...</p> : 
                             comments.length > 0 ? comments.map(comment => <Comment key={comment.comment_id} comment={comment} />) : 
                             <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>}
                        </div>

                        {loggedInUser && (
                             <form onSubmit={handlePostComment} className="mt-6 flex gap-3">
                                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500" />
                                <button type="submit" className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"><Send size={20}/></button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
