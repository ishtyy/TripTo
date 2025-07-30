import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { postsAPI } from '../services/api';
import BlogPostCard from "../components/blog/BlogPostCard";
import PostTileCard from "../components/blog/PostTileCard";
import { Loader2, PenSquare, User as UserIcon, Search, ChevronDown, Compass, FileText, Users, TrendingUp, Star, Activity, Calendar, Tag } from "lucide-react";

const searchOptions = [
  { id: 'destinations', label: 'Destinations', icon: Compass, color: 'from-blue-500 to-cyan-500' },
  { id: 'posts', label: 'Posts', icon: FileText, color: 'from-purple-500 to-pink-500' },
  { id: 'communities', label: 'Communities', icon: Users, color: 'from-green-500 to-emerald-500' },
];

/**
 * A helper function to generate initials from a username.
 */
const getInitials = (name) => {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

/**
 * Sub-component: the “Share your story…” prompt.
 */
const CreatePostPrompt = ({ user, onOpenBlogModal, onTriggerSignIn }) => {
    const handleClick = () => {
        if (user) {
            onOpenBlogModal();
        } else {
            onTriggerSignIn();
        }
    };

    return (
        <div className="bg-gray-900/80 p-4 rounded-xl border-2 border-gray-800 flex items-center gap-4">
            {/* ✅ FIX: This logic now correctly handles the logged-in vs. logged-out state. */}
            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0">
                {user ? (
                    <img 
                        src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${getInitials(user.username)}&background=22d3ee&color=000&bold=true`} 
                        alt={user.username} 
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-700">
                        <UserIcon size={20} className="text-gray-400" />
                    </div>
                )}
            </div>

            <div
                onClick={handleClick}
                className="flex-1 px-4 py-2 text-left bg-gray-800 hover:bg-gray-700/80 border border-gray-700 rounded-lg cursor-pointer transition-colors"
            >
                <p className="text-gray-400">Share your story...</p>
            </div>

            <button
                onClick={handleClick}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
                <PenSquare size={18} />
                <span>Create Post</span>
            </button>
        </div>
    );
};

/**
 * Search Component for the right sidebar
 */
const SearchSection = ({ user, posts }) => {
    const [searchCategory, setSearchCategory] = useState(searchOptions[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [trendingTags, setTrendingTags] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };
        
        const fetchTrendingTags = async () => {
            try {
                const response = await postsAPI.getTrendingTags();
                setTrendingTags(response.data.tags || []);
            } catch (error) {
                console.error('Failed to fetch trending tags:', error);
            }
        };
        
        fetchStats();
        fetchTrendingTags();
    }, []);

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        navigate(`/search?type=${searchCategory.id}&q=${encodeURIComponent(searchTerm)}`);
    };

    const handleTagClick = (tagName) => {
        navigate(`/explore?tag=${encodeURIComponent(tagName)}`);
    };

    const quickStats = [
        { label: 'Active Travelers', value: stats?.users?.active || 0, icon: Activity, color: 'text-green-400', highlight: true }
    ];

    return (
        <div className="space-y-6">
            {/* User Profile Stats */}
            {user && (
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <img 
                            src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${getInitials(user.username)}&background=22d3ee&color=000&bold=true`} 
                            alt={user.username} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                        />
                        <div>
                            <h3 className="text-lg font-bold text-white">{user.username}</h3>
                            <p className="text-sm text-gray-400">Your Activity</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                            <FileText className="text-purple-400 mx-auto mb-1" size={20} />
                            <p className="text-lg font-bold text-white">{posts?.filter(p => p.author_id === user.user_id).length || 0}</p>
                            <p className="text-xs text-gray-400">Your Posts</p>
                        </div>
                        <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <Users className="text-blue-400 mx-auto mb-1" size={20} />
                            <p className="text-lg font-bold text-white">{user.followers_count || 0}</p>
                            <p className="text-xs text-gray-400">Followers</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Trending Tags */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Tag className="text-orange-400" size={20} />
                    Trending Tags
                </h3>
                <div className="space-y-3">
                    {trendingTags.length > 0 ? (
                        trendingTags.slice(0, 6).map((tag, index) => (
                            <div 
                                key={index} 
                                onClick={() => handleTagClick(tag.name)}
                                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-purple-500/20 cursor-pointer transition-all border border-gray-700/50 hover:border-orange-500/30"
                            >
                                <div className="flex items-center gap-2">
                                    <Tag className="text-orange-400" size={14} />
                                    <span className="text-white font-medium text-sm">#{tag.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">{tag.count} posts</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-gray-400">
                            <Tag size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No trending tags yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Travelers Stats */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="text-green-400" size={20} />
                    Active Travelers
                </h3>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30 shadow-lg shadow-green-500/10">
                    <Activity className="text-green-400 mx-auto mb-3" size={32} />
                    <p className="text-3xl font-bold text-white mb-2">{stats?.users?.active || 0}</p>
                    <p className="text-sm text-gray-300 mb-1">Travelers Online</p>
                    <p className="text-xs text-green-300">Join the community!</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Search className="text-cyan-400" size={20} />
                    Quick Search
                </h3>
                
                <div className="flex flex-col gap-3">
                    <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-white font-medium bg-gradient-to-r ${searchCategory.color} hover:opacity-90 transition-all rounded-lg`}
                        >
                            <div className="flex items-center gap-2">
                                <searchCategory.icon size={16} />
                                <span>{searchCategory.label}</span>
                            </div>
                            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full mt-2 w-full bg-gray-900/95 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden backdrop-blur-sm">
                                {searchOptions.map((option) => (
                                    <div 
                                        key={option.id} 
                                        onClick={() => { setSearchCategory(option); setIsDropdownOpen(false); }} 
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer transition-all text-white"
                                    >
                                        <option.icon size={16} className="text-gray-300" />
                                        <span>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={`Search ${searchCategory.label.toLowerCase()}...`}
                            className="flex-1 bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none px-4 py-3 text-sm rounded-lg border border-gray-600 focus:border-cyan-400 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button 
                            onClick={handleSearch} 
                            disabled={!searchTerm.trim()} 
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Main Page: displays the prompt + feed of blog posts.
 */
export default function HomePage({
  user,
  onTriggerSignIn,
  onOpenBlogModal,
  onViewPost,
  onCascade,
  dataVersion
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let response;
        if (user) {
          // If user is logged in, fetch posts from followed users
          response = await api.get("/posts/following?limit=20");
        } else {
          // If not logged in, show all posts
          response = await api.get("/posts?limit=20");
        }
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        // Fallback to all posts if following posts fail
        if (user) {
          try {
            const fallbackResponse = await api.get("/posts?limit=20");
            setPosts(fallbackResponse.data.posts || []);
          } catch (fallbackError) {
            console.error("Error fetching fallback posts:", fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [dataVersion, user]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex gap-8">
        {/* Left Column - Main Content */}
        <div className="flex-1 max-w-4xl space-y-6">
          {/* Share your story prompt */}
          <CreatePostPrompt
            user={user}
            onOpenBlogModal={onOpenBlogModal}
            onTriggerSignIn={onTriggerSignIn}
          />

          {/* Feed of posts - Tiled Layout */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-cyan-500" size={40} />
            </div>
          ) : posts.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {user ? "Stories from People You Follow" : "Latest Stories"}
                </h2>
                <span className="text-sm text-gray-400">{posts.length} posts</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, idx) => (
                  <PostTileCard
                    key={post.post_id}
                    post={post}
                    user={user}
                    onTriggerSignIn={onTriggerSignIn}
                    onViewPost={(post) => onViewPost(post, posts)}
                    animationDelay={idx * 50}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white">
                {user ? "No Stories Yet" : "No Posts Yet"}
              </h2>
              <p className="text-gray-400 mt-2">
                {user ? "Follow some travelers to see their stories here!" : "Be the first to share a story!"}
              </p>
              {user && (
                <Link 
                  to="/explore" 
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Discover Travelers
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Search and Stats */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            <SearchSection user={user} posts={posts} />
          </div>
        </div>
      </div>
    </div>
  );
}