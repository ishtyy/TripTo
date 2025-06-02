// frontend/src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import BlogModal from "../components/BlogModal.jsx";
import { Plus } from "lucide-react";

export default function HomePage({ user }) {
  const [posts, setPosts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function fetchPosts() {
    try {
      const res = await api.get("/posts");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Fetch Posts Error:", err);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-heading text-sky-400">Recent Posts</h2>
        {user && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1 bg-ocean hover:bg-ocean/90 text-white px-3 py-1 rounded"
          >
            <Plus size={16} />
            <span>New Post</span>
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400">No posts yet</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.post_id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
            >
              <h3 className="text-xl font-semibold text-gray-100">
                {post.title}
              </h3>
              <p className="mt-2 text-gray-300">{post.content}</p>
              <div className="mt-2 text-gray-500 text-sm">
                By {post.user_profile.username} on{" "}
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <BlogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPostCreated={(newPost) => {
          setPosts([newPost, ...posts]);
        }}
      />
    </div>
  );
}
