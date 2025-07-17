import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, ArrowUp, ArrowDown, MessageSquare, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

const PostAuthor = ({ author, createdAt }) => (
    <div className="flex items-center gap-3">
        <Link to={`/profile/${author.user_id}`}>
            <img src={author.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=374151&color=fff`} alt={author.username} className="w-11 h-11 rounded-full"/>
        </Link>
        <div>
            <Link to={`/profile/${author.user_id}`} className="font-semibold text-white hover:underline">{author.username}</Link>
            <p className="text-xs text-gray-400">{formatTimeAgo(createdAt)}</p>
        </div>
    </div>
);

const Comment = ({ comment }) => (
    <div className="flex items-start gap-3">
        <Link to={`/profile/${comment.user.user_id}`} className="flex-shrink-0">
            <img src={comment.user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.username)}&background=374151&color=fff`} alt={comment.user.username} className="w-9 h-9 rounded-full"/>
        </Link>
        <div className="flex-1 bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
                <Link to={`/profile/${comment.user.user_id}`} className="font-semibold text-white text-sm hover:underline">{comment.user.username}</Link>
                <p className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</p>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap mt-1 text-sm">{comment.content}</p>
        </div>
    </div>
);

export default function CommunityViewPostModal({ open, onClose, post, user, onTriggerSignIn }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState({ comments: true, postComment: false });
    const [voteCount, setVoteCount] = useState(0);
    const [userVote, setUserVote] = useState(null);

    useEffect(() => {
        if (open && post?.post_id) {
            setLoading(p => ({ ...p, comments: true }));
            api.get(`/community-posts/${post.post_id}/comments`)
                .then(res => setComments(res.data || []))
                .catch(() => toast.error("Failed to load comments."))
                .finally(() => setLoading(p => ({ ...p, comments: false })));
            setVoteCount((post.upvote_count ?? 0) - (post.downvote_count ?? 0));
            setUserVote(post.user_vote);
        }
    }, [open, post]);
    
    const handleVote = async (voteType) => {
        if (!user) return onTriggerSignIn?.();
        const oldVote = userVote;
        const newVote = oldVote === voteType ? null : voteType;
        setUserVote(newVote);
        setVoteCount(prev => {
            if (newVote === 1) return oldVote === -1 ? prev + 2 : prev + 1;
            if (newVote === -1) return oldVote === 1 ? prev - 2 : prev - 1;
            if (oldVote === 1) return prev - 1;
            if (oldVote === -1) return prev + 1;
            return prev;
        });
        try {
            await api.post(`/community-posts/${post.post_id}/vote`, { vote_type: newVote });
        } catch (error) {
            toast.error("Vote failed.");
            setUserVote(oldVote);
            setVoteCount((post.upvote_count ?? 0) - (post.downvote_count ?? 0));
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || loading.postComment) return;
        setLoading(p => ({ ...p, postComment: true }));
        try {
            const { data: createdComment } = await api.post(`/community-posts/${post.post_id}/comments`, { content: newComment });
            setComments(p => [...p, createdComment]);
            setNewComment('');
        } catch (error) {
            toast.error("Failed to post comment.");
        } finally {
            setLoading(p => ({ ...p, postComment: false }));
        }
    };

    if (!open || !post) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            {/* ✅ FIX: The modal container now adapts its height to the content. */}
            <div 
                className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col animate-slide-up-fast max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
                    <PostAuthor author={post.user_profile} createdAt={post.created_at} />
                    <button onClick={onClose} className="btn btn-ghost btn-circle"><X size={24} /></button>
                </div>
                
                {/* This main section will scroll if the content is too long */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <h2 className="text-3xl font-bold text-white mb-4">{post.title}</h2>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-800 flex items-center gap-6 text-sm">
                        <div className="flex items-center bg-gray-800/50 rounded-full">
                            <button onClick={() => handleVote(1)} className={`p-2 rounded-full transition-colors ${userVote === 1 ? 'text-yellow-400 bg-yellow-900/50' : 'text-gray-400 hover:bg-gray-700'}`}><ArrowUp size={18} /></button>
                            <span className="font-bold text-base text-white px-3">{voteCount}</span>
                            <button onClick={() => handleVote(-1)} className={`p-2 rounded-full transition-colors ${userVote === -1 ? 'text-gray-400 bg-gray-700' : 'text-gray-400 hover:bg-gray-700'}`}><ArrowDown size={18} /></button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400"><MessageSquare size={18} /><span>{comments.length} Comments</span></div>
                    </div>

                     <div className="mt-8 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Comments</h3>
                        {loading.comments ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-yellow-400" size={24}/></div>
                        ) : comments.length > 0 ? (
                            comments.map(c => <Comment key={c.comment_id} comment={c} />)
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">No comments yet.</p>
                        )}
                    </div>
                </div>

                {user && (
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex-shrink-0">
                        <form onSubmit={handlePostComment} className="flex gap-3 items-center">
                            <img src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`} alt="Your avatar" className="w-9 h-9 rounded-full"/>
                            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="input-primary flex-1"/>
                            <button type="submit" disabled={loading.postComment || !newComment.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-black w-10 h-10 p-0 rounded-full flex items-center justify-center">
                                {loading.postComment ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}