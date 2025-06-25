import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Search, ChevronDown, Compass, Users, FileText, Star, Rss } from 'lucide-react';
import { CommunityCardSkeleton } from '../components/CommunityCardSkeleton';
import { PostCardSkeleton } from '../components/PostCardSkeleton';
import BlogPostCard from '../components/BlogPostCard'; // The missing import is now added

const searchOptions = [
    { id: 'destinations', label: 'Destinations', icon: Compass },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'communities', label: 'Communities', icon: Users },
];

export default function ExplorePage({ onViewPost }) {
    const [communities, setCommunities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchCategory, setSearchCategory] = useState(searchOptions[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchExploreData() {
            setLoading(true);
            try {
                const [communitiesRes, postsRes] = await Promise.all([
                    api.get('/communities?limit=4'),
                    api.get('/posts?limit=3')
                ]);
                setCommunities(communitiesRes.data.communities || []);
                setPosts(postsRes.data.posts || []);
            } catch (error) {
                console.error("Failed to fetch explore page data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchExploreData();
    }, []);

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        navigate(`/search?type=${searchCategory.id}&q=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <div className="space-y-12 animate-fade-in-up">
            <section className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                <h1 className="text-3xl font-bold text-white mb-4">Explore</h1>
                <div className="flex items-center bg-gray-800/80 border-2 border-gray-700 rounded-lg shadow-lg">
                    <div ref={dropdownRef} className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 pl-4 pr-3 py-3 text-white font-semibold h-full hover:bg-purple-900/40 transition-colors rounded-l-md">
                            <searchCategory.icon size={20} className="text-purple-400"/>
                            <span>{searchCategory.label}</span>
                            <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-10 overflow-hidden">
                                {searchOptions.map(option => (
                                    <div key={option.id} onClick={() => { setSearchCategory(option); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-purple-600/30 cursor-pointer transition-colors">
                                        <option.icon size={18} className="text-purple-400"/>
                                        <span>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <input type="text" placeholder={`Search for ${searchCategory.label.toLowerCase()}...`} className="w-full h-full bg-transparent text-white placeholder-gray-500 focus:outline-none px-4" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                    <button onClick={handleSearch} className="p-3 m-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                        <Search size={20} />
                    </button>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Star className="text-cyan-400"/> Featured Communities</h2>
                {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><CommunityCardSkeleton/><CommunityCardSkeleton/><CommunityCardSkeleton/><CommunityCardSkeleton/></div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {communities.map((community, index) => (
                            <Link key={community.community_id} to={`/communities/${community.community_id}`} className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 hover:border-cyan-500 transition-all duration-300 flex flex-col group hover:shadow-2xl animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 mb-2 truncate transition-colors">{community.community_name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 flex-grow">{community.description}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Rss className="text-purple-400"/> Trending Posts</h2>
                {loading ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><PostCardSkeleton/><PostCardSkeleton/><PostCardSkeleton/></div> : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {posts.map((post, index) => (
                            <BlogPostCard 
                                key={post.post_id}
                                post={post}
                                onCardClick={onViewPost}
                                animationDelay={index * 100}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}