import React from 'react';
import { Link } from 'react-router-dom';
import { Repeat } from 'lucide-react';

// A sub-component for the embedded parent post
const QuotedPost = ({ post }) => (
    <div className="mt-3 p-3 border-l-4 border-purple-800 bg-gray-800/50 rounded-r-lg">
        <div className="text-sm text-gray-400 mb-1">
            Cascading from <span className="font-semibold text-purple-300">{post.author.username}</span>
        </div>
        <p className="text-gray-200 font-semibold truncate">{post.title}</p>
        <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>
    </div>
);


export default function BlogPostCard({ post, onCardClick, animationDelay = 0 }) {
  return (
    <div
      className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 hover:border-purple-600 transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:shadow-2xl hover:shadow-purple-600/20 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => onCardClick(post)}
    >
      <div>
        {post.parent_post && (
            <div className="text-purple-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Repeat size={14} />
                <span>Cascade</span>
            </div>
        )}
        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 mb-2 truncate transition-colors" title={post.title}>
            {post.title}
        </h3>
        <p className="text-gray-400 text-sm mb-2 line-clamp-3">{post.content}</p>
        
        {/* If it's a cascade, show the embedded parent post */}
        {post.parent_post && <QuotedPost post={post.parent_post} />}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
        <p>By: <span className="font-medium text-gray-300">{post.user_profile?.username || "Unknown"}</span></p>
      </div>
    </div>
  );
}