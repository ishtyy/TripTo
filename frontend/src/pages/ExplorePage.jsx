import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { postsAPI } from '../services/api';
import { ChevronDown, Users, FileText, Star, Rss, TrendingUp, BarChart3, Tag, Filter } from 'lucide-react';
import CommunityCardSkeleton from '../components/community/CommunityCardSkeleton.jsx';
import PostCardSkeleton from "../components/blog/PostCardSkeleton.jsx";
import PostTileCard from "../components/blog/PostTileCard.jsx";

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

  useEffect(() => {
    async function fetchExploreData() {
      setLoading(true);
      try {
        const [communitiesRes, postsRes, tagsRes] = await Promise.all([
          api.get('/communities'),
          api.get('/posts'),  // Removed limit
          postsAPI.getTrendingTags().catch(() => ({ data: { tags: [] } }))
        ]);
        
        setCommunities(communitiesRes.data.communities || []);
        const fetchedPosts = postsRes.data.posts || [];
        setAllPosts(fetchedPosts);
        setPosts(fetchedPosts);  // Show all posts initially
        setTrendingTags(tagsRes.data.tags || []);
        
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

  return (
    <div className="space-y-8 animate-fade-in-up">
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
    </div>
  );
}
