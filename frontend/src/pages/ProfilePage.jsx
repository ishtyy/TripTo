// frontend/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserCircle, Edit, Mail, CalendarDays, MapPin, Users, FileText, ShieldCheck, LogOut } from 'lucide-react';

// InfoCard Component
const InfoCard = ({ title, children, icon: Icon }) => (
  <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
    <div className="flex items-center text-sky-400 mb-3">
      {Icon && <Icon size={20} className="mr-2" />}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="text-gray-300 text-sm space-y-2">
      {children}
    </div>
  </div>
);

export default function ProfilePage({ user, onSignOut }) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/'); 
      return;
    }
    
    setProfileData(user);
    setLoadingProfile(false); 

    const fetchUserSpecificData = async () => {
      let accumulatedError = "";

      setLoadingPosts(true);
      try {
        console.log(`[ProfilePage] Fetching posts for user_id: ${user.user_id}`);
        const postsRes = await api.get(`/posts?user_id=${user.user_id}`);
        setUserPosts(postsRes.data.posts || []);
        console.log(`[ProfilePage] Fetched ${postsRes.data.posts?.length || 0} posts.`);
      } catch (err) {
        console.error("Fetch User Posts Error:", err.response?.data || err.message);
        accumulatedError += " Failed to load your blog posts.";
      } finally {
        setLoadingPosts(false);
      }

      setLoadingCommunities(true);
      try {
        console.log(`[ProfilePage] Fetching joined communities for user_id: ${user.user_id}`);
        // This calls the endpoint from usersRoutes.js (ID: users_routes_joined_communities)
        const communitiesRes = await api.get(`/users/${user.user_id}/communities`);
        setJoinedCommunities(communitiesRes.data.communities || []);
        console.log(`[ProfilePage] Fetched ${communitiesRes.data.communities?.length || 0} joined communities.`);
      } catch (err) {
        console.error("Fetch Joined Communities Error:", err.response?.data || err.message);
        accumulatedError += " Failed to load your joined communities.";
         if (err.response?.status === 403) {
            console.warn("User not authorized to fetch joined communities for this ID, or mismatch.");
            accumulatedError += " (Not authorized or user ID mismatch for communities).";
        } else if (err.response?.status === 401) {
            accumulatedError += " Your session might have expired when fetching communities."
        }
      } finally {
        setLoadingCommunities(false);
      }
      if (accumulatedError) setError(accumulatedError.trim());
    };

    if (user && user.user_id) { // Ensure user_id is available before fetching
        fetchUserSpecificData();
    } else if (user && !user.user_id) {
        console.error("[ProfilePage] User object is present but user_id is missing. Cannot fetch specific data.", user);
        setError("User ID is missing, cannot fetch detailed data.");
        setLoadingPosts(false);
        setLoadingCommunities(false);
    }

  }, [user, navigate]);

  if (loadingProfile) {
    return <div className="text-center py-10 text-gray-400">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="text-center py-10 text-red-500">Could not load profile data. Please ensure you are logged in.</div>;
  }
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 bg-gray-800 rounded-xl shadow-2xl">
        <img
          src={profileData.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username)}&background=1D4ED8&color=fff&size=128&font-size=0.5&bold=true`}
          alt={`${profileData.username}'s avatar`}
          className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-sky-500 object-cover shadow-md bg-gray-700"
        />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{profileData.username}</h1>
          <p className="text-sky-400 mt-1">{profileData.email}</p>
          <p className="text-gray-400 mt-2 text-sm max-w-md">{profileData.bio || "No bio provided yet. Click 'Edit Profile' to add one!"}</p>
          <p className="text-xs text-gray-500 mt-2">Joined: {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}</p>
          <button 
            onClick={() => alert("Edit profile functionality (TODO)")}
            className="mt-4 inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            <Edit size={16} className="mr-2" />
            Edit Profile (TODO)
          </button>
        </div>
      </div>

      {error && (
         <div className="p-3 bg-yellow-200 border border-yellow-500 text-yellow-800 rounded-md text-sm">
            Note: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard title="My Blog Posts" icon={FileText}>
          {loadingPosts ? <p className="text-gray-400">Loading posts...</p> : userPosts.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {userPosts.map(post => (
                <li key={post.post_id} className="p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
                  {/* TODO: Ensure you have a route like /posts/:postId for general blog posts */}
                  <Link to={`/posts/${post.post_id}`} className="text-sky-300 hover:underline block truncate" title={post.title}>
                    {post.title}
                  </Link>
                  <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No blog posts yet.</p>
          )}
        </InfoCard>

        <InfoCard title="Joined Communities" icon={Users}>
          {loadingCommunities ? <p className="text-gray-400">Loading communities...</p> : joinedCommunities.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {joinedCommunities.map(community => (
                <li key={community.community_id} className="p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
                  <Link to={`/communities/${community.community_id}`} className="text-sky-300 hover:underline block truncate" title={community.community_name}>
                    {community.community_name}
                  </Link>
                   {/* You can display the role if needed:
                   {community.user_role_in_community && <span className="text-xs text-gray-500 ml-2">({community.user_role_in_community})</span>} 
                   */}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">You haven't joined any communities yet.</p>
          )}
          <Link to="/communities" className="mt-3 inline-block text-sm text-sky-400 hover:underline">Explore Communities</Link>
        </InfoCard>
        
        <InfoCard title="Account Settings" icon={ShieldCheck}>
            <button className="text-sky-300 hover:underline w-full text-left p-1 hover:bg-gray-700/50 rounded">Change Password (TODO)</button>
            <button className="text-sky-300 hover:underline w-full text-left p-1 hover:bg-gray-700/50 rounded">Manage Notifications (TODO)</button>
            <button className="text-red-400 hover:text-red-300 hover:underline w-full text-left mt-2 p-1 hover:bg-red-900/30 rounded">Delete Account (TODO)</button>
        </InfoCard>
      </div>
    </div>
  );
}
