import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageSquare, GitBranch, Calendar, MapPin, Tag } from 'lucide-react';

export default function PostTileCard({ post, onViewPost }) {
    const navigate = useNavigate();
    const netScore = (post.upvote_count || 0) - (post.downvote_count || 0);
    
    return (
        <div 
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-4 border border-gray-700 hover:border-purple-400 transition-all duration-300 group cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm"
            onClick={() => onViewPost(post)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-5">
                        {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{post.user_profile?.username || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                
                {/* Vote Score */}
                <div className="flex items-center gap-1 bg-gray-800/60 rounded-full px-2 py-1 ml-2">
                    <ArrowUp size={12} className={netScore > 0 ? 'text-green-400' : 'text-gray-500'} />
                    <span className="text-xs font-medium text-white">{netScore}</span>
                    <ArrowDown size={12} className={netScore < 0 ? 'text-red-400' : 'text-gray-500'} />
                </div>
            </div>

            {/* Content Preview */}
            <p className="text-gray-300 text-xs line-clamp-3 mb-3 leading-4">
                {post.content}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/explore?tag=${encodeURIComponent(tag.tag_name)}`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 hover:text-purple-200 text-xs rounded-full border border-purple-700/50 hover:border-purple-600 transition-all duration-200"
                        >
                            <Tag size={8} />
                            {tag.tag_name}
                        </button>
                    ))}
                    {post.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{post.tags.length - 3} more</span>
                    )}
                </div>
            )}

            {/* Location */}
            {post.location?.location_name && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <MapPin size={10} />
                    <span>{post.location.location_name}</span>
                    {post.location.country && <span>, {post.location.country}</span>}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>{post.comment_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <GitBranch size={12} />
                        <span>{post.cascade_count || 0}</span>
                    </div>
                </div>
                
                <div className="text-xs text-purple-400 group-hover:text-purple-300 transition-colors">
                    Read more →
                </div>
            </div>
        </div>
    );
}
