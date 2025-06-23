import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import BlogModal from "../components/BlogModal.jsx";
import ViewPostModal from "../components/ViewPostModal.jsx";
import { Plus, Rss, Search, ChevronDown, Compass, Users, FileText } from "lucide-react";
import { PostCardSkeleton } from "../components/PostCardSkeleton.jsx";
import BlogPostCard from "../components/BlogPostCard.jsx";

const searchOptions = [
    { id: 'destinations', label: 'Destinations', icon: Compass },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'communities', label: 'Communities', icon: Users },
];

export default function HomePage({ user, onTriggerSignIn }) {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [fetchPostsError, setFetchPostsError] = useState("");
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [selectedPostForView, setSelectedPostForView] = useState(null);
  const [searchCategory, setSearchCategory] = useState(searchOptions[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [dataVersion, setDataVersion] = useState(0);
  const refreshPosts = () => {
    setDataVersion(v => v + 1);
    setIsBlogModalOpen(false);
  };

  useEffect(() => {
    async function fetchPosts() {
      setIsLoadingPosts(true);
      setFetchPostsError("");
      try {
        const res = await api.get("/posts");
        setPosts(res.data.posts || []);
      } catch (err) {
        setFetchPostsError("Could not load posts. Please try again later.");
      } finally {
        setIsLoadingPosts(false);
      }
    }
    fetchPosts();
  }, [dataVersion]);

  const handleViewPost = (post) => {
    setSelectedPostForView(post);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/search?type=${searchCategory.id}&q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="space-y-12">
      

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Rss className="text-purple-400"/>Recent Posts</h2>
          {user && ( <button onClick={() => setIsBlogModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40"> <Plus size={20} /> <span>New Post</span> </button> )}
        </div>
        
        {isLoadingPosts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <BlogPostCard key={post.post_id} post={post} onCardClick={handleViewPost} animationDelay={index * 100} />
            ))}
          </div>
        )}
      </section>

      <BlogModal open={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} onPostCreated={refreshPosts} user={user} onTriggerSignIn={onTriggerSignIn} />
      <ViewPostModal open={!!selectedPostForView} onClose={() => setSelectedPostForView(null)} post={selectedPostForView} />
    </div>
  );
}