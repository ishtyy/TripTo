import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Search, ChevronDown, Compass, Users, FileText, Star, Rss } from 'lucide-react';
import CommunityCardSkeleton from '../components/community/CommunityCardSkeleton.jsx';
import PostCardSkeleton from "../components/blog/PostCardSkeleton.jsx";
import BlogPostCard from "../components/blog/BlogPostCard.jsx"; // Using the full-featured card

const searchOptions = [
  { id: 'destinations', label: 'Destinations', icon: Compass },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'communities', label: 'Communities', icon: Users },
];

const FeaturedCommunityCard = ({ community, index }) => (
  <Link
    to={`/communities/${community.community_id}`}
    className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 hover:border-cyan-500 transition-all duration-300 flex flex-col group hover:shadow-2xl animate-fade-in-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 mb-2 truncate transition-colors">
      {community.community_name}
    </h3>
    <p className="text-gray-400 text-sm line-clamp-2 flex-grow">
      {community.description}
    </p>
  </Link>
);

// ✅ FIX: The component now correctly receives all necessary props
export default function ExplorePage({ user, onTriggerSignIn, onViewPost, onCascade }) {
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCategory, setSearchCategory] = useState(searchOptions[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchExploreData() {
      setLoading(true);
      try {
        const [communitiesRes, postsRes] = await Promise.all([
          api.get('/communities?limit=4'),
          api.get('/posts?limit=5'), // Fetch a few more posts for the explore page
        ]);
        setCommunities(communitiesRes.data.communities || []);
        setPosts(postsRes.data.posts || []);
      } catch (error) {
        console.error('Failed to fetch explore page data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchExploreData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/search?type=${searchCategory.id}&q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="space-y-12 animate-fade-in-up">
      <section className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex items-center bg-gray-800/80 border-2 border-gray-700 rounded-lg shadow-lg">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-4 pr-3 py-3 text-white font-semibold h-full hover:bg-purple-900/40 transition-colors rounded-l-md"
            >
              <searchCategory.icon size={20} className="text-purple-400" />
              <span>{searchCategory.label}</span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-10 overflow-hidden">
                {searchOptions.map((option) => (
                  <div key={option.id} onClick={() => { setSearchCategory(option); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-purple-600/30 cursor-pointer">
                    <option.icon size={18} className="text-purple-400" />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder={`Search for ${searchCategory.label.toLowerCase()}...`}
            className="w-full h-full bg-transparent text-white placeholder-gray-500 focus:outline-none px-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} className="p-3 m-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg">
            <Search size={20} />
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <Star className="text-cyan-400" /> Featured Communities
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <CommunityCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {communities.map((community, index) => <FeaturedCommunityCard key={community.community_id} community={community} index={index} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <Rss className="text-purple-400" /> Trending Posts
        </h2>
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {posts.map((post, index) => (
              // ✅ FIX: All necessary props are now passed to the card, making it interactive
              <BlogPostCard
                key={post.post_id}
                post={post}
                user={user}
                onTriggerSignIn={onTriggerSignIn}
                onViewPost={onViewPost}
                onCascade={onCascade}
                animationDelay={index * 100}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
