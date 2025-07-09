import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Edit, Users, ShieldCheck, Loader2 } from 'lucide-react';
import ViewPostModal from "../components/blog/ViewPostModal.jsx";

// Card for displaying a post on the profile page
const ProfilePostCard = ({ post, onViewPost }) => (
    // Changed from a Link to a div with an onClick handler
    <div 
        onClick={() => onViewPost(post)}
        className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 hover:border-purple-600 transition-all duration-300 flex flex-col group hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer"
    >
        <h3 className="font-bold text-white group-hover:text-purple-300 mb-2 truncate transition-colors" title={post.title}>
            {post.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 flex-grow">
            {post.content}
        </p>
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700/50">
            {new Date(post.created_at).toLocaleDateString()}
        </div>
    </div>
);

const InfoCard = ({ title, children, icon: Icon }) => (
    <div className="bg-gray-900/80 border border-gray-800 p-5 rounded-xl shadow-lg h-full">
        <div className="flex items-center text-cyan-400 mb-4">
            {Icon && <Icon size={20} className="mr-3" />}
            <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <div className="text-gray-300 text-sm space-y-2">
            {children}
        </div>
    </div>
);

export default function ProfilePage({ loggedInUser }) {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for controlling the post view modal
  const [selectedPost, setSelectedPost] = useState(null);
  
  const isOwnProfile = loggedInUser?.user_id === userId;

  useEffect(() => {
    // The data fetching logic remains the same
    async function fetchProfileData() {
        if (!userId) return;
        setLoading(true);
        try {
            const [profileRes, postsRes, communitiesRes] = await Promise.all([
                api.get(`/users/${userId}`),
                api.get(`/posts?user_id=${userId}`),
                isOwnProfile ? api.get(`/users/${userId}/communities`) : Promise.resolve({ data: { communities: [] } })
            ]);
            setProfileData(profileRes.data.user);
            setUserPosts(postsRes.data.posts || []);
            setJoinedCommunities(communitiesRes.data.communities || []);
        } catch (err) {
            setError("Failed to load profile. This user may not exist.");
        } finally {
            setLoading(false);
        }
    }
    fetchProfileData();
  }, [userId, isOwnProfile]);

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-cyan-500" size={40}/></div>;
  if (error) return <div className="text-center py-10 text-red-400">{error}</div>;
  if (!profileData) return <div className="text-center py-10 text-gray-400">User not found.</div>;
  
  return (
    <>
      <div className="space-y-12 animate-fade-in-up">
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 bg-gray-900/80 border border-gray-800 rounded-2xl shadow-2xl">
          <img
            src={profileData.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username)}&background=22d3ee&color=000&size=128&bold=true`}
            alt={`${profileData.username}'s avatar`}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-cyan-500 object-cover shadow-lg shadow-cyan-900/40 bg-gray-700"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{profileData.username}</h1>
            <p className="text-cyan-400 mt-2 text-lg">{profileData.email}</p>
            <p className="text-gray-300 mt-3 text-base max-w-xl">{profileData.bio || "This user hasn't added a bio yet."}</p>
            {isOwnProfile && (
              <button onClick={() => alert("Edit profile functionality (TODO)")} className="mt-6 inline-flex items-center px-5 py-2 bg-cyan-600/50 hover:bg-cyan-600 border border-cyan-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all">
                  <Edit size={16} className="mr-2" />
                  Edit Profile
              </button>
            )}
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
              {isOwnProfile ? "My" : `${profileData?.username}'s`} Blog Posts
          </h2>
          {userPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPosts.map(post => <ProfilePostCard key={post.post_id} post={post} onViewPost={() => setSelectedPost(post)} />)}
              </div>
          ) : (
              <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800">
                  <p className="text-gray-400">No blog posts have been created yet.</p>
              </div>
          )}
        </section>

        {isOwnProfile && (
          <section>
              <h2 className="text-2xl font-bold text-white mb-4">My Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoCard title="My Joined Communities" icon={Users}>
                    {/* ... content for joined communities ... */}
                  </InfoCard>
                  <InfoCard title="Account Settings" icon={ShieldCheck}>
                    {/* ... content for account settings ... */}
                  </InfoCard>
              </div>
          </section>
        )}
      </div>
        </div>
      {/* Render the modal for viewing a post */}
      <ViewPostModal open={!!selectedPost} onClose={() => setSelectedPost(null)} post={selectedPost} />
    </>
  );
}