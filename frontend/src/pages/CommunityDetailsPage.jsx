// frontend/src/pages/CommunityDetailsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeft, Users, Edit3, Settings, LogIn, LogOut, UserPlus, UserMinus, 
    MessageCircle, Star, HelpCircle, Pin as PinIcon, User as UserIcon // Ensure UserIcon is imported
} from 'lucide-react';
import CreateCommunityPostModal from '../components/CreateCommunityPostModal.jsx';
import ViewCommunityPostModal from '../components/ViewCommunityPostModal.jsx';

// Individual Community Post Card
const CommunityPostCard = ({ post, onPostClick }) => (
  <div 
    className="bg-gray-700/70 p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
    onClick={() => onPostClick(post)}
  >
    <h4 className="text-lg font-semibold text-sky-300 group-hover:text-sky-200 mb-1 truncate" title={post.title}>{post.title}</h4>
    <p className="text-sm text-gray-300 line-clamp-3 mb-2">{post.content}</p>
    <div className="text-xs text-gray-400 flex justify-between items-center">
      <span className="flex items-center">
        {/* Use the imported UserIcon here */}
        <UserIcon size={12} className="mr-1 text-gray-500 flex-shrink-0"/> 
        <span className="truncate">{post.user_profile?.username || 'Unknown'}</span>
      </span>
      <span>{new Date(post.created_at).toLocaleDateString()}</span>
    </div>
  </div>
);

export default function CommunityDetailsPage({ user, onTriggerSignIn }) {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]); 
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState({ isMember: false, role: null, details: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedPostToView, setSelectedPostToView] = useState(null);
  const [isViewPostModalOpen, setIsViewPostModalOpen] = useState(false);

  const fetchCommunityData = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    setError('');
    try {
      const communityRes = await api.get(`/communities/${communityId}`);
      setCommunity(communityRes.data.community);

      const postsRes = await api.get(`/community-posts?communityId=${communityId}`);
      const allPosts = postsRes.data.posts || [];
      
      setPinnedPosts(allPosts.filter(p => p.is_pinned === true)); 
      setCommunityPosts(allPosts.filter(p => p.is_pinned !== true));

      const membersRes = await api.get(`/communities/${communityId}/members`);
      setMembers(membersRes.data.members || []);

      if (user) {
        const membershipRes = await api.get(`/communities/${communityId}/membership`);
        setMembership(membershipRes.data);
      } else {
        setMembership({ isMember: false, role: null, details: null });
      }

    } catch (err) {
      console.error("Fetch Community Data Error:", err); // Log the full error
      // Check if the error is due to token expiration
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please sign in again.');
        // onTriggerSignIn(); // This might be too aggressive, let App.jsx handle global 401
      } else {
        setError(err.response?.data?.error || 'Failed to load community data.');
      }
      if (err.response?.status === 404 && !err.message.includes("membership")) { // Avoid clearing community if only membership check failed
        setCommunity(null);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, user]); // Removed onTriggerSignIn from deps, it's a stable function

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const handleJoinCommunity = async () => { 
    if (!user) { onTriggerSignIn(); return; }
    setActionInProgress(true);
    try {
      await api.post(`/communities/${communityId}/join`);
      fetchCommunityData(); 
    } catch (err) { 
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to join."); 
      if (err.response?.status === 401) setError('Session expired. Please sign in.');
    } 
    finally { setActionInProgress(false); }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !membership.isMember) return;
    if (membership.role === 'admin' && members.filter(m => m.role === 'admin').length <= 1) {
        alert("As the only admin, you cannot leave. Transfer ownership or delete community (TODO)."); return;
    }
    if (!window.confirm("Leave this community?")) return;
    setActionInProgress(true);
    try {
      await api.delete(`/communities/${communityId}/leave`);
      fetchCommunityData();
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to leave."); 
      if (err.response?.status === 401) setError('Session expired. Please sign in.');
    }
    finally { setActionInProgress(false); }
  };
  
  const handleCommunityPostCreated = (newPost) => {
    setCommunityPosts(prevPosts => [newPost, ...prevPosts]);
    setIsCreatePostModalOpen(false);
  };

  const handleViewCommunityPost = (post) => {
    setSelectedPostToView(post);
    setIsViewPostModalOpen(true);
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading community...</div>;
  // Display specific error message, then fallback if community is null
  if (error && !community && !loading) return <div className="text-center py-10 text-red-500 bg-red-100 p-4 rounded-md">{error} <Link to="/communities" className="text-sky-500 hover:underline ml-2">Go back</Link></div>;
  if (!community) return <div className="text-center py-10 text-gray-400">Community not found. <Link to="/communities" className="text-sky-400 hover:underline">Go back</Link></div>;
  
  // Display general error if community data is present but other errors occurred (e.g. membership fetch)
  if (error && community) {
    // Display this error more subtly if main content can still be shown
     console.warn("Partial error on CommunityDetailsPage:", error);
  }


  const canPostInCommunity = membership.isMember;
  const isAdmin = membership.isMember && membership.role === 'admin';

  const faqItems = [
    { q: "How do I join?", a: "Click the 'Join Community' button if you're signed in!" },
    { q: "What are the rules?", a: "Be respectful, share relevant content, and have fun. Specific rules may be pinned by admins." },
    { q: "How can I become an admin?", a: "Admins are typically appointed by existing admins based on contribution and trust."}
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sky-400 hover:text-sky-300 mb-1 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <header className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-heading text-white mb-2 break-words">{community.community_name}</h1>
                <p className="text-gray-400 mb-1 text-sm">Located in: {community.location?.location_name || "N/A"}{community.location?.country ? `, ${community.location.country}` : ""}</p>
                <p className="text-sm text-gray-300">{community.description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto shrink-0">
                {!user && ( <button onClick={onTriggerSignIn} disabled={actionInProgress} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"> <LogIn size={16} className="mr-2"/> Sign in to Join </button> )}
                {user && !membership.isMember && ( <button onClick={handleJoinCommunity} disabled={actionInProgress} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"> <UserPlus size={16} className="mr-2"/> Join Community </button> )}
                {user && membership.isMember && ( <button onClick={handleLeaveCommunity} disabled={actionInProgress} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"> <UserMinus size={16} className="mr-2"/> Leave Community </button> )}
                {isAdmin && ( <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"> <Settings size={16} className="mr-2"/> Admin (TODO) </button> )}
            </div>
        </div>
      </header>
      
      {error && community && ( // Display non-critical errors here
        <div className="my-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md text-sm">
            Note: {error}
        </div>
      )}


      {pinnedPosts.length > 0 && (
        <section className="space-y-3 p-4 bg-gray-800/50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center mb-3 border-b border-gray-700 pb-2">
                <PinIcon size={20} className="mr-2 text-yellow-400 transform -rotate-45"/> Pinned Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} />)}
            </div>
        </section>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-100 flex items-center"><MessageCircle size={24} className="mr-3 text-sky-400"/>Community Feed</h2>
            {canPostInCommunity && (
                 <button onClick={() => setIsCreatePostModalOpen(true)} className="bg-sunset hover:bg-sunset/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                    <Edit3 size={16} className="mr-2"/> Create Post
                </button>
            )}
            {!user && !canPostInCommunity && ( <p className="text-sm text-gray-400"><button onClick={onTriggerSignIn} className="text-sky-400 hover:underline">Sign in</button> to join and post.</p> )}
            {user && !canPostInCommunity && ( <p className="text-sm text-gray-400">Join community to post.</p> )}
          </div>
          {communityPosts.length > 0 ? (
            <div className="space-y-4">
              {communityPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} />)}
            </div>
          ) : (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-md text-center">
                {pinnedPosts.length > 0 && communityPosts.length === 0 ? "No other posts yet." : 
                 (canPostInCommunity ? "No posts yet. Be the first!" : "No posts in this community yet.")
                }
            </p>
          )}
        </main>

        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-100 mb-3 flex items-center">
                <Users size={20} className="mr-2 text-sky-400"/> Members <span className="text-sm text-gray-400 ml-1">({members.length})</span>
            </h3>
            {members.length > 0 ? (
                <ul className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {members.map(member => (
                        <li key={member.user_id} className="flex items-center justify-between text-gray-300 text-sm p-1.5 hover:bg-gray-700/50 rounded">
                           <span className="flex items-center">
                                <span className="w-5 h-5 bg-gray-600 rounded-full mr-2 flex-shrink-0"></span> 
                                <span className="truncate">{member.user_profile?.username || 'Loading...'}</span>
                           </span>
                           <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${member.role === 'admin' ? 'bg-sky-500 text-white' : 'bg-gray-600 text-gray-200'}`}>
                               {member.role}
                           </span>
                        </li>
                    ))}
                </ul>
            ) : ( <p className="text-sm text-gray-400">No members yet.</p> )}
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-100 mb-3 flex items-center">
                <HelpCircle size={20} className="mr-2 text-green-400"/> FAQ
            </h3>
            <div className="space-y-3">
                {faqItems.map((item, index) => (
                    <details key={index} className="text-sm group">
                        <summary className="font-medium text-gray-200 hover:text-sky-300 cursor-pointer list-none flex justify-between items-center p-1 rounded hover:bg-gray-700/50">
                            {item.q}
                            <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </summary>
                        <p className="text-gray-400 mt-1 pl-3 py-1 border-l-2 border-gray-700">{item.a}</p>
                    </details>
                ))}
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-100 mb-3 flex items-center">
                <Star size={20} className="mr-2 text-yellow-400"/> Featured (TODO)
            </h3>
            <p className="text-sm text-gray-400">Featured content or links will appear here. Admins can manage this.</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-100 mb-3">About this Community</h3>
            <p className="text-sm text-gray-300 whitespace-pre-line">{community.description}</p>
            <p className="text-xs text-gray-400 mt-3">Created: {new Date(community.created_at).toLocaleDateString()}</p>
          </div>
        </aside>
      </div>

      {isCreatePostModalOpen && community && (
        <CreateCommunityPostModal
            open={isCreatePostModalOpen}
            onClose={() => setIsCreatePostModalOpen(false)}
            user={user}
            communityId={community.community_id}
            onPostCreated={handleCommunityPostCreated}
            onTriggerSignIn={onTriggerSignIn}
        />
      )}

      <ViewCommunityPostModal
        open={isViewPostModalOpen}
        onClose={() => setIsViewPostModalOpen(false)}
        post={selectedPostToView}
      />
    </div>
  );
}
