import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { postsAPI } from '../services/api';
import BlogPostCard from "../components/blog/BlogPostCard";
import PostTileCard from "../components/blog/PostTileCard";
import { Loader2, PenSquare, User as UserIcon, Search, ChevronDown, Compass, FileText, Users, TrendingUp, Star, Activity, Calendar, Tag, X } from "lucide-react";

const searchOptions = [
  { id: 'destinations', label: 'Destinations', icon: Compass, color: 'from-blue-500 to-cyan-500' },
  { id: 'posts', label: 'Posts', icon: FileText, color: 'from-purple-500 to-pink-500' },
  { id: 'communities', label: 'Communities', icon: Users, color: 'from-green-500 to-emerald-500' },
];

/**
 * Active Followers Tray Component - Compact bottom mini tray
 */
const ActiveFollowersTray = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFollowers, setActiveFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActiveFollowers = async () => {
      if (!user || !isOpen) return;
      
      setLoading(true);
      try {
        // Fetch active users that the current user follows
        const response = await api.get('/users/active-followers');
        setActiveFollowers(response.data.users || []);
      } catch (error) {
        console.error('Failed to fetch active followers:', error);
        setActiveFollowers([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchActiveFollowers();
    }
  }, [isOpen, user]);

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Mini Tray Container */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Expanded Tray */}
        {isOpen && (
          <div className="mb-4 bg-gray-900/95 border border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm w-80 max-h-96 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-green-600/20 to-emerald-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="text-green-400" size={20} />
                  <div>
                    <h3 className="text-white font-semibold">Active Followers</h3>
                    <p className="text-xs text-gray-400">People you follow who are online</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-green-400" size={24} />
                </div>
              ) : activeFollowers.length > 0 ? (
                <div className="p-2">
                  {activeFollowers.map((follower) => (
                    <Link
                      key={follower.user_id}
                      to={`/users/${follower.user_id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="relative">
                        <img 
                          src={follower.profile_picture_url || `https://ui-avatars.com/api/?name=${getInitials(follower.username)}&background=22d3ee&color=000&bold=true`} 
                          alt={follower.username} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-green-400"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate group-hover:text-green-300 transition-colors">{follower.username}</p>
                        <p className="text-xs text-gray-400 truncate">{follower.bio || 'Exploring the world'}</p>
                      </div>
                      <div className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Profile
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 text-gray-400">
                  <Users size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No active followers</p>
                  <p className="text-xs">None of your followers are online right now</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mini Tab Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg border border-green-500/50 transition-all duration-200 flex items-center gap-3 min-w-48 ${
            isOpen ? 'shadow-green-500/30 scale-105' : 'hover:scale-105 hover:shadow-green-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            <div className="text-left">
              <div className="text-sm font-semibold">Active Followers</div>
              <div className="text-xs text-green-100">
                {activeFollowers.length > 0 ? `${activeFollowers.length} online` : 'Check who\'s online'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>
    </>
  );
};

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
    const [trendingTags, setTrendingTags] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrendingTags = async () => {
            try {
                const response = await postsAPI.getTrendingTags();
                setTrendingTags(response.data.tags || []);
            } catch (error) {
                console.error('Failed to fetch trending tags:', error);
            }
        };
        
        fetchTrendingTags();
    }, []);

    const handleTagClick = (tagName) => {
        navigate(`/explore?tag=${encodeURIComponent(tagName)}`);
    };

    return (
        <div className="space-y-6">
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

            {/* Search Section - Moved to sidebar for cleaner layout */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Search className="text-cyan-400" size={20} />
                    Quick Search
                </h3>
                <p className="text-sm text-gray-400 mb-4">Search moved to main content area for better visibility</p>
                <Link 
                    to="/search" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg transition-all text-sm"
                >
                    <Search size={16} />
                    Go to Search
                </Link>
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
  const [searchCategory, setSearchCategory] = useState(searchOptions[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/search?type=${searchCategory.id}&q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex gap-8">
        {/* Left Column - Main Content - Full Width */}
        <div className="flex-1 space-y-6">
          {/* Enhanced Compact Search Section - Full Width & Streamlined */}
          <section className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-xl p-5 border border-gray-700/50 backdrop-blur-lg shadow-xl shadow-purple-900/10">
            {/* Compact Header - Reduced margins */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-500/30">
                <Search className="text-cyan-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Discover & Explore
                </h2>
                <p className="text-xs text-gray-400">Find your next adventure, connect with travelers, and explore stories</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Category Selector - Compact Left Column */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Category
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-white font-medium bg-gradient-to-r ${searchCategory.color} hover:opacity-90 transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl border border-white/10 hover:border-white/20`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-white/20 rounded backdrop-blur-sm">
                        <searchCategory.icon size={16} />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-semibold">{searchCategory.label}</span>
                      </div>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 w-full bg-gray-900/98 border border-gray-600/50 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                      {searchOptions.map((option) => (
                        <div 
                          key={option.id} 
                          onClick={() => { setSearchCategory(option); setIsDropdownOpen(false); }} 
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700/50 cursor-pointer transition-all duration-200 text-white border-b border-gray-700/50 last:border-b-0 group"
                        >
                          <div className={`p-1.5 bg-gradient-to-r ${option.color} rounded-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                            <option.icon size={14} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="block font-medium text-sm group-hover:text-white transition-colors">{option.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Search Input - Extended Right Columns */}
              <div className="lg:col-span-3 space-y-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Search Query
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-500" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      searchCategory.id === 'destinations' ? 'e.g., "Santorini sunset", "Tokyo cherry blossoms"' :
                      searchCategory.id === 'posts' ? 'e.g., "solo backpacking tips", "street food adventures"' :
                      'e.g., "photography enthusiasts", "budget travelers"'
                    }
                    className="w-full pl-10 pr-14 py-2.5 bg-gray-800/60 text-white placeholder-gray-500 focus:outline-none rounded-lg border-2 border-gray-700/50 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 transition-all duration-300 text-sm backdrop-blur-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={handleSearch} 
                    disabled={!searchTerm.trim()} 
                    className="absolute inset-y-0 right-0 pr-2 flex items-center"
                  >
                    <div className="p-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none">
                      <Search size={14} className="text-white" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Quick Search Suggestions */}
            <div className="mt-3 pt-3 border-t border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Quick Search
                </label>
                <span className="text-xs text-cyan-400 font-medium">
                  {searchCategory.id === 'destinations' ? '1000+' : searchCategory.id === 'posts' ? '5000+' : '200+'} available
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {searchCategory.id === 'destinations' && [
                  { term: 'Tokyo', emoji: '🏮' },
                  { term: 'Iceland', emoji: '❄️' },
                  { term: 'Santorini', emoji: '🏛️' },
                  { term: 'Nepal', emoji: '🏔️' },
                  { term: 'Bali', emoji: '�' },
                  { term: 'Paris', emoji: '🗼' }
                ].map(({ term, emoji }) => (
                  <button
                    key={term}
                    onClick={() => { setSearchTerm(term); handleSearch(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 hover:border-blue-400/40 rounded-lg transition-all duration-300 text-xs group"
                  >
                    <span className="text-xs">{emoji}</span>
                    <span className="text-white font-medium group-hover:text-cyan-300 transition-colors">{term}</span>
                  </button>
                ))}
                
                {searchCategory.id === 'posts' && [
                  { term: 'Solo Travel', emoji: '🎒' },
                  { term: 'Food Guide', emoji: '🍜' },
                  { term: 'Photography', emoji: '📸' },
                  { term: 'Adventure', emoji: '⛰️' },
                  { term: 'Budget Tips', emoji: '💰' },
                  { term: 'Culture', emoji: '🎭' }
                ].map(({ term, emoji }) => (
                  <button
                    key={term}
                    onClick={() => { setSearchTerm(term); handleSearch(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-400/40 rounded-lg transition-all duration-300 text-xs group"
                  >
                    <span className="text-xs">{emoji}</span>
                    <span className="text-white font-medium group-hover:text-purple-300 transition-colors">{term}</span>
                  </button>
                ))}
                
                {searchCategory.id === 'communities' && [
                  { term: 'Backpackers', emoji: '🎒' },
                  { term: 'Digital Nomads', emoji: '💻' },
                  { term: 'Photographers', emoji: '📷' },
                  { term: 'Hikers', emoji: '🥾' },
                  { term: 'Foodies', emoji: '🍽️' },
                  { term: 'Artists', emoji: '🎨' }
                ].map(({ term, emoji }) => (
                  <button
                    key={term}
                    onClick={() => { setSearchTerm(term); handleSearch(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/20 hover:border-green-400/40 rounded-lg transition-all duration-300 text-xs group"
                  >
                    <span className="text-xs">{emoji}</span>
                    <span className="text-white font-medium group-hover:text-green-300 transition-colors">{term}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

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

      {/* Active Followers Tray - Bottom sliding tray */}
      <ActiveFollowersTray user={user} />
    </div>
  );
}