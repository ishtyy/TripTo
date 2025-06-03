// frontend/src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import BlogModal from "../components/BlogModal.jsx";
import ViewPostModal from "../components/ViewPostModal.jsx"; // Import the new modal
import { Plus, ExternalLink } from "lucide-react";

export default function HomePage({ user, onTriggerSignIn }) {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [fetchPostsError, setFetchPostsError] = useState("");
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  
  const [selectedPostForView, setSelectedPostForView] = useState(null); // State for the post to view
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-heading text-sky-400">Recent Posts</h1>
        {user && (
          <button
            onClick={() => setIsBlogModalOpen(true)}
            className="flex items-center space-x-2 bg-ocean hover:bg-ocean/90 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus size={20} />
            <span>New Post</span>
          </button>
        )}
      </div>

      {isLoadingPosts && (
        <div className="text-center py-10"><p className="text-gray-400 text-lg">Loading posts...</p></div>
      )}

      {!isLoadingPosts && fetchPostsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center" role="alert">
          <p><strong className="font-bold">Error:</strong> {fetchPostsError}</p>
        </div>
      )}

      {!isLoadingPosts && !fetchPostsError && posts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
          {!user && (
            <p className="text-gray-500 mt-2">
              <button onClick={onTriggerSignIn} className="text-sky-400 hover:text-sky-300 underline">Sign in</button> to create a post.
            </p>
          )}
        </div>
      )}

      {!isLoadingPosts && !fetchPostsError && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.post_id}
              className="bg-gray-800 rounded-lg p-5 shadow-lg hover:shadow-sky-500/20 hover:border-sky-500 border border-transparent transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              onClick={() => handleViewPost(post)} // Open modal on click
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-100 group-hover:text-sky-300 mb-2 truncate transition-colors" title={post.title}>
                  {post.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                  {post.content}
                </p>
              </div>
              <div className="mt-auto pt-3 border-t border-gray-700 text-xs text-gray-500">
                <p>By: <span className="font-medium text-gray-400">{post.user_profile?.username || "Unknown User"}</span></p>
                <p>Location: <span className="text-gray-400">{post.location?.location_name || "N/A"}{post.location?.country ? `, ${post.location.country}` : ""}</span></p>
                <p>Posted: <span className="text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span></p>
                <div className="text-sky-400 group-hover:text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2 flex items-center text-xs">
                    View Post <ExternalLink size={12} className="ml-1"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isBlogModalOpen && (
        <BlogModal
          open={isBlogModalOpen}
          onClose={() => setIsBlogModalOpen(false)}
          onPostCreated={handlePostCreated}
          user={user}
          onTriggerSignIn={onTriggerSignIn}
        />
      )}

      {/* Render the ViewPostModal */}
      <ViewPostModal
        open={isViewPostModalOpen}
        onClose={() => setIsViewPostModalOpen(false)}
        post={selectedPostForView}
      />
    </div>
  );
}
