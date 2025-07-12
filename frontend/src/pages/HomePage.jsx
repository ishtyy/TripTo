import { useEffect, useState } from "react";
import api from '../services/api';
import BlogPostCard from "../components/blog/BlogPostCard";
import { Loader2 } from "lucide-react";

export default function HomePage({ user, onTriggerSignIn, onViewPost, onCascade, dataVersion }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/posts?limit=20');
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
      {/* The unnecessary header has been removed as requested */}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-cyan-500" size={40} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <BlogPostCard
                key={post.post_id}
                post={post}
                user={user}
                onTriggerSignIn={onTriggerSignIn}
                onViewPost={onViewPost}
                onCascade={onCascade}
                animationDelay={index * 100}
              />
            ))
          ) : (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white">No Posts Yet</h2>
                <p className="text-gray-400 mt-2">Be the first to share a story!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
