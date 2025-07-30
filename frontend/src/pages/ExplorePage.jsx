import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { postsAPI } from '../services/api';
import { ChevronDown, Users, FileText, Star, Rss, TrendingUp, BarChart3, Tag, Filter, Search, Activity, User as UserIcon, Compass } from 'lucide-react';
import CommunityCardSkeleton from '../components/community/CommunityCardSkeleton.jsx';
import PostCardSkeleton from "../components/blog/PostCardSkeleton.jsx";
import PostTileCard from "../components/blog/PostTileCard.jsx";

const searchOptions = [
  { id: 'destinations', label: 'Destinations', icon: Compass, color: 'from-blue-500 to-cyan-500' },
  { id: 'posts', label: 'Posts', icon: FileText, color: 'from-purple-500 to-pink-500' },
  { id: 'communities', label: 'Communities', icon: Users, color: 'from-green-500 to-emerald-500' },
];

const FeaturedCommunityCard = ({ community, index }) => (
  <Link
    to={`/communities/${community.community_id}`}
    className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-lg p-4 shadow-lg border border-gray-700 hover:border-cyan-400 transition-all duration-300 flex flex-col group hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 truncate transition-colors">
        {community.community_name}
      </h3>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Users size={12} />
        <span>{community.member_count || 0}</span>
      </div>
    </div>
    <p className="text-gray-400 text-xs line-clamp-2 flex-grow mb-3">
      {community.description || 'Discover amazing destinations and connect with fellow travelers.'}
    </p>
    <div className="text-xs text-gray-500">
      <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
    </div>
  </Link>
);

export default function ExplorePage({ user, onTriggerSignIn, onViewPost, onCascade }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [searchCategory, setSearchCategory] = useState(searchOptions[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchExploreData() {
      setLoading(true);
      try {
        const [communitiesRes, postsRes, tagsRes, usersRes] = await Promise.all([
          api.get('/communities'),
          api.get('/posts'),  // Removed limit
          postsAPI.getTrendingTags().catch(() => ({ data: { tags: [] } })),
          api.get('/stats').catch(() => ({ data: { users: { active: [], count: 0 } } }))
        ]);
        
        setCommunities(communitiesRes.data.communities || []);
        const fetchedPosts = postsRes.data.posts || [];
        setAllPosts(fetchedPosts);
        setPosts(fetchedPosts);  // Show all posts initially
        setTrendingTags(tagsRes.data.tags || []);
        setActiveUsers(usersRes.data.users?.active || []);
        
        // Check for tag parameter in URL
        const tagParam = searchParams.get('tag');
        if (tagParam && tagsRes.data.tags) {
          const matchingTag = tagsRes.data.tags.find(tag => 
            tag.name.toLowerCase() === tagParam.toLowerCase()
          );
          if (matchingTag) {
            handleTagFilterWithTag(matchingTag);
          }
        }
      } catch (error) {
        console.error('Failed to fetch explore page data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchExploreData();
  }, [searchParams]);

  const handleTagFilterWithTag = async (tag) => {
    setSelectedTag(tag.name);
    try {
      // Fetch posts specifically for this tag
      const response = await api.get(`/posts/by-tag/${encodeURIComponent(tag.name)}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
      // Fallback to client-side filtering
      const filteredPosts = allPosts.filter(post => 
        post.tags && post.tags.some(postTag => postTag.tag_name === tag.name)
      );
      setPosts(filteredPosts);
    }
  };

  const handleTagFilter = async (tag) => {
    if (selectedTag === tag.name) {
      setSelectedTag(null);
      setPosts(allPosts);  // Show all posts instead of slice
      // Remove tag parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('tag');
      setSearchParams(newSearchParams);
    } else {
      // Update URL with tag parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tag', tag.name);
      setSearchParams(newSearchParams);
      
      await handleTagFilterWithTag(tag);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/search?type=${searchCategory.id}&q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Search Section - Top Priority */}
      <section className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-white">Quick Search</h2>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="relative">
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
      </section>

      {/* Trending Tags Section */}
      {trendingTags.length > 0 && (
        <section className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-orange-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Trending Tags</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {trendingTags.slice(0, 12).map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagFilter(tag)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTag === tag.name
                    ? 'bg-purple-600 text-white border border-purple-500 shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:border-purple-500 hover:text-purple-300 hover:bg-purple-900/20'
                }`}
              >
                <Tag size={14} />
                {tag.name}
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Trending Posts */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Rss className="text-purple-400" /> 
              {selectedTag ? `Posts tagged "${selectedTag}"` : 'Trending Posts'}
            </h2>
            <Link 
              to="/posts" 
              className="text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors text-sm"
            >
              View All <ChevronDown className="rotate-[-90deg]" size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post, index) => (
                <PostTileCard
                  key={post.post_id}
                  post={post}
                  onViewPost={(post) => onViewPost(post, posts)}
                />
              ))}
              {posts.length === 0 && selectedTag && (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  <Tag size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No posts found with the tag "{selectedTag}"</p>
                  <button 
                    onClick={() => handleTagFilter({ name: selectedTag })}
                    className="mt-2 text-purple-400 hover:text-purple-300"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Featured Communities */}
        <div className="lg:col-span-1 space-y-6">
          {/* Featured Communities */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="text-cyan-400" /> Communities
              </h2>
              <Link 
                to="/communities" 
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors text-sm"
              >
                All <ChevronDown className="rotate-[-90deg]" size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <CommunityCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-4">
                {communities.map((community, index) => 
                  <FeaturedCommunityCard key={community.community_id} community={community} index={index} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Travelers Section - Bottom */}
      <section className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-green-400" size={24} />
          <h2 className="text-2xl font-bold text-white">Active Travelers</h2>
          <span className="ml-auto text-sm text-gray-400">{activeUsers.length} online</span>
        </div>
        
        {activeUsers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {activeUsers.slice(0, 12).map((activeUser, index) => (
              <div key={activeUser.user_id || index} className="flex flex-col items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-all cursor-pointer group">
                <div className="relative mb-2">
                  <img 
                    src={activeUser.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser.username || 'User')}&background=22d3ee&color=000&bold=true`} 
                    alt={activeUser.username || 'User'} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-500 group-hover:border-green-400 transition-colors"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <p className="text-white text-sm font-medium text-center truncate w-full">{activeUser.username || 'Anonymous'}</p>
                <p className="text-gray-400 text-xs text-center">{activeUser.location || 'Exploring'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Activity size={48} className="mx-auto mb-4 opacity-50" />
            <p>No active travelers right now</p>
            <p className="text-sm mt-1">Be the first to start exploring!</p>
          </div>
        )}
      </section>
    </div>
  );
}
