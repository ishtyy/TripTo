import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import BlogModal from "../components/BlogModal.jsx";
import ViewPostModal from "../components/ViewPostModal.jsx";
import { Plus, Rss } from "lucide-react";
import { PostCardSkeleton } from "../components/PostCardSkeleton.jsx";
import BlogPostCard from "../components/BlogPostCard.jsx";

export default function HomePage({ user, onTriggerSignIn, onOpenBlogModal, dataVersion }) {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [fetchPostsError, setFetchPostsError] = useState("");
  const [selectedPostForView, setSelectedPostForView] = useState(null);

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

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Rss className="text-purple-400"/>Recent Blog Posts
          </h1>
          {user && (
            <button
              onClick={onOpenBlogModal}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40"
            >
              <Plus size={20} />
              <span>New Post</span>
            </button>
          )}
        </div>
        
        {isLoadingPosts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : fetchPostsError ? (
          <div className="text-center py-10 text-red-400 bg-red-900/30 p-4 rounded-md">{fetchPostsError}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 rounded-xl">
            <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
            {!user && (
              <p className="text-gray-500 mt-2">
                <button onClick={onTriggerSignIn} className="text-purple-400 hover:text-purple-300 font-semibold underline">Sign in</button> to create a post.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <BlogPostCard 
                key={post.post_id} 
                post={post} 
                onCardClick={handleViewPost}
                animationDelay={index * 100}
              />
            ))}
          </div>
        )}
      </section>

      <ViewPostModal 
        open={!!selectedPostForView} 
        onClose={() => setSelectedPostForView(null)} 
        post={selectedPostForView}
        loggedInUser={user}
      />
    </div>
  );
}