import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import api from '../services/api';
import BlogPostCard from '../components/blog/BlogPostCard';
import ViewPostModal from '../components/blog/ViewPostModal';
import CascadeModal from '../components/blog/CascadeModal';

export default function TaggedPostsPage({ user, onTriggerSignIn }) {
    const { tagName } = useParams();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cascadePost, setCascadePost] = useState(null);

    useEffect(() => {
        fetchTaggedPosts();
    }, [tagName]);

    const fetchTaggedPosts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/posts/by-tag/${encodeURIComponent(tagName)}`);
            setPosts(response.data.posts || []);
        } catch (err) {
            console.error('Error fetching tagged posts:', err);
            setError('Failed to load posts for this tag');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPost = (post) => {
        const index = posts.findIndex(p => p.post_id === post.post_id);
        setCurrentIndex(index);
        setSelectedPost(post);
    };

    const handleNavigatePost = (newIndex) => {
        if (newIndex >= 0 && newIndex < posts.length) {
            setCurrentIndex(newIndex);
            setSelectedPost(posts[newIndex]);
        }
    };

    const handleCascade = (post) => {
        setCascadePost(post);
    };

    const handlePostCreated = (newPost) => {
        setPosts([newPost, ...posts]);
        setSelectedPost(null);
        setCascadePost(null);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading posts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Go back to homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full">
                        <Tag size={20} />
                        <span className="font-semibold text-lg">{tagName}</span>
                    </div>
                    <span className="text-gray-400">
                        {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                    </span>
                </div>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <Tag size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No posts found with this tag</p>
                    <p className="text-gray-500">Be the first to create a post with the tag "{tagName}"!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {posts.map((post) => (
                        <BlogPostCard
                            key={post.post_id}
                            post={post}
                            user={user}
                            onTriggerSignIn={onTriggerSignIn}
                            onViewPost={handleViewPost}
                            onCascade={handleCascade}
                        />
                    ))}
                </div>
            )}

            {/* Post Modal */}
            <ViewPostModal
                open={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                post={selectedPost}
                loggedInUser={user}
                onTriggerSignIn={onTriggerSignIn}
                onCascade={handleCascade}
                allPosts={posts}
                currentIndex={currentIndex}
                onNavigate={handleNavigatePost}
            />

            {/* Cascade Modal */}
            <CascadeModal
                open={!!cascadePost}
                onClose={() => setCascadePost(null)}
                parentPost={cascadePost}
                user={user}
                onTriggerSignIn={onTriggerSignIn}
                onPostCreated={handlePostCreated}
            />
        </div>
    );
}
