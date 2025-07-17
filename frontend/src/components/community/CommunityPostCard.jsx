import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, MessageSquare } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

export default function CommunityPostCard({ post, onPostClick }) {
    // Fallback for missing user profile to prevent crashes
    const userProfile = post.user_profile || {};

    return (
        <div 
            className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800 hover:border-yellow-500/40 transition-all cursor-pointer"
            onClick={() => onPostClick(post)}
        >
            <div className="p-5">
                <div className="flex items-center space-x-3 mb-4">
                    <Link to={`/profile/${userProfile.user_id}`} onClick={e => e.stopPropagation()} className="flex-shrink-0">
                        <img 
                            src={userProfile.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.username || 'A')}`} 
                            alt={userProfile.username || 'User'} 
                            className="w-10 h-10 rounded-full"
                        />
                    </Link>
                    <div>
                        <Link to={`/profile/${userProfile.user_id}`} onClick={e => e.stopPropagation()} className="font-semibold text-white hover:underline">
                            {userProfile.username || 'Anonymous'}
                        </Link>
                        <p className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</p>
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2">{post.title}</h2>
                {post.content && <p className="text-gray-300 text-sm line-clamp-3">{post.content}</p>}
            </div>
            <div className="bg-gray-800/40 px-5 py-3 flex justify-start items-center text-sm text-gray-400 border-t border-gray-800 space-x-6">
                <div className="flex items-center space-x-1.5">
                    <ArrowUp size={16}/> 
                    <span>{(post.upvote_count || 0) - (post.downvote_count || 0)} votes</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <MessageSquare size={16}/> 
                    <span>{post.comment_count || 0} comments</span>
                </div>
            </div>
        </div>
    );
}