// frontend/src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import BlogModal from "../components/BlogModal.jsx";
import ViewPostModal from "../components/ViewPostModal.jsx";
import { Plus, ExternalLink, Rss } from "lucide-react";
import { PostCardSkeleton } from "../components/PostCardSkeleton.jsx";

export default function HomePage({ user, onTriggerSignIn }) {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [fetchPostsError, setFetchPostsError] = useState("");
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [selectedPostForView, setSelectedPostForView] = useState(null);
  const [isViewPostModalOpen, setIsViewPostModalOpen] = useState(false);

  async function fetchPosts() {
    setIsLoadingPosts(true);
    setFetchPostsError("");
    console.log("[HomePage] Fetching posts...");
    try {
      const res = await api.get("/posts");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("[HomePage] Fetch Posts Error:", err.response || err.message);
      setFetchPostsError(err.response?.data?.error || "Could not load posts. Please try again later.");
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setIsBlogModalOpen(false);
  };

  const handleViewPost = (post) => {
    setSelectedPostForView(post);
    setIsViewPostModalOpen(true);
  };

  return (
      <div className="space-y-12 animate-fade-in-up">
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          <Rss className="text-purple-400" />
          Recent Posts
        </h1>
        {user && (
          <button
            onClick={() => setIsBlogModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40"
          >
            <Plus size={20} />
            <span>New Post</span>
          </button>
        )}
      </div>

      {isLoadingPosts && <p className="text-center py-10 text-gray-400">Loading posts...</p>}
      {fetchPostsError && <div className="text-center py-10 text-red-400 bg-red-900/30 p-4 rounded-md">{fetchPostsError}</div>}

      {!isLoadingPosts && !fetchPostsError && posts.length === 0 && (
        <div className="text-center py-16 bg-gray-900/50 rounded-xl">
          <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
          {!user && (
            <p className="text-gray-500 mt-2">
              <button onClick={onTriggerSignIn} className="text-purple-400 hover:text-purple-300 font-semibold underline">Sign in</button> to create a post.
            </p>
          )}
        </div>
      )}

      {!isLoadingPosts && !fetchPostsError && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.post_id}
              className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 hover:border-purple-600 transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:shadow-2xl hover:shadow-purple-600/20"
              onClick={() => handleViewPost(post)}
            >
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 mb-2 truncate transition-colors" title={post.title}>
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{post.content}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-700/50 text-xs text-gray-500 space-y-1">
                <p>By: <span className="font-medium text-gray-300">{post.user_profile?.username || "Unknown"}</span></p>
                <p>Location: <span className="font-medium text-gray-300">{post.location?.location_name || "N/A"}</span></p>
                <div className="text-purple-400 group-hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-2 flex items-center text-sm font-semibold">
                    View Post <ExternalLink size={14} className="ml-1.5"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isBlogModalOpen && <BlogModal open={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} onPostCreated={ (newPost) => { setPosts(p => [newPost, ...p]); setIsBlogModalOpen(false); }} user={user} onTriggerSignIn={onTriggerSignIn} />}
      <ViewPostModal open={isViewPostModalOpen} onClose={() => setIsViewPostModalOpen(false)} post={selectedPostForView} />
    </div>
    </div>
  );
}