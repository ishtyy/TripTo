import { useEffect, useState } from "react";
import api from '../services/api';
import BlogPostCard from "../components/blog/BlogPostCard";
import { Loader2, PenSquare, User as UserIcon } from "lucide-react";

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

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get("/posts?limit=20");
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [dataVersion]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Share your story prompt */}
        <CreatePostPrompt
          user={user}
          onOpenBlogModal={onOpenBlogModal}
          onTriggerSignIn={onTriggerSignIn}
        />

        {/* Feed of posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-cyan-500" size={40} />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post, idx) => (
            <BlogPostCard
              key={post.post_id}
              post={post}
              user={user}
              onTriggerSignIn={onTriggerSignIn}
              onViewPost={onViewPost}
              onCascade={onCascade}
              animationDelay={idx * 50}
            />
          ))
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">No Posts Yet</h2>
            <p className="text-gray-400 mt-2">Be the first to share a story!</p>
          </div>
        )}
      </div>
    </div>
  );
}