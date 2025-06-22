// frontend/src/pages/CommunityDetailsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeft, Users, Edit3, Settings, LogIn, LogOut, UserPlus, UserMinus, 
    MessageCircle, Star, HelpCircle, Pin as PinIcon, User as UserIcon, Info, Edit2, Loader2
} from 'lucide-react'; // Added Loader2 for button loading state
import CreateCommunityPostModal from '../components/CreateCommunityPostModal.jsx';
import ViewCommunityPostModal from '../components/ViewCommunityPostModal.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';

// Individual Community Post Card with your requested hover color
const CommunityPostCard = ({ post, onPostClick, isFeatured, isPinned }) => (
  <div 
    // The hover color is now set to your specific hex code using Tailwind's arbitrary value syntax
    className={`p-4 rounded-lg shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[180px] 
      ${isPinned ? 'bg-sky-800/30 hover:bg-sky-700/40 border-2 border-sky-600' : 
       isFeatured ? 'bg-amber-700/30 hover:bg-amber-600/40 border-2 border-amber-500' : 
       'bg-gray-700/90 hover:bg-[#090040]'}`} // Correct hover color applied
    onClick={() => onPostClick(post)}
  >
    <div>
      <h4 
        className={`font-semibold group-hover:text-white mb-1 truncate text-lg
          ${isPinned ? 'text-sky-200' : isFeatured ? 'text-amber-300' : 'text-sky-300'}`} 
        title={post.title}
      >
        {post.title}
      </h4>
      <p className="text-sm text-gray-300 group-hover:text-gray-200 line-clamp-3 mb-2">{post.content}</p>
    </div>
    <div className="text-xs text-gray-400 group-hover:text-gray-300 flex justify-between items-center mt-auto pt-2 border-t border-gray-600/60">
      <span className="flex items-center">
        <UserIcon size={12} className="mr-1 text-gray-500 group-hover:text-gray-400 flex-shrink-0"/> 
        <span className="truncate">{post.user_profile?.username || 'Unknown'}</span>
      </span>
      <span>{new Date(post.created_at).toLocaleDateString()}</span>
    </div>
  </div>
);

// MemberBarAvatar (no changes needed)
const MemberBarAvatar = ({ member }) => {
    const username = member.user_profile?.username || 'User';
    const avatarUrl = member.user_profile?.profile_picture_url || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(username.split(' ').map(n=>n[0]).join('').substring(0,2))}&background=374151&color=E5E7EB&size=48&font-size=0.45&bold=true&format=svg`;
    return (
        <Link 
            to={`/profile/${member.user_id}`}
            className="flex flex-col items-center text-center w-20 shrink-0 group p-1 hover:bg-gray-700/50 rounded-md transition-colors" 
            title={username}
        >
            <img src={avatarUrl} alt={username} className="w-12 h-12 bg-gray-600 rounded-full mb-1 border-2 border-gray-700 group-hover:border-sky-500 transition-all object-cover"/>
            <span className="text-xs text-gray-400 group-hover:text-sky-300 truncate w-full">{username}</span>
            {member.role === 'admin' && <span className="text-[10px] text-sky-500">Admin</span>}
        </Link>
    );
};

export default function CommunityDetailsPage({ user, onTriggerSignIn }) {
  const { communityId } = useParams();
  const navigate = useNavigate();
  // ... (All other state hooks remain the same) ...
  const [community, setCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]); 
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState({ isMember: false, role: null, details: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedPostToView, setSelectedPostToView] = useState(null);
  const [isViewPostModalOpen, setIsViewPostModalOpen] = useState(false);

  const fetchCommunityData = useCallback(async () => {
    // ... (fetchCommunityData logic remains the same as provided in context) ...
    if (!communityId) return; setLoading(true); setError('');
    try {
      const communityRes = await api.get(`/communities/${communityId}`); setCommunity(communityRes.data.community);
      const postsRes = await api.get(`/community-posts?communityId=${communityId}`);
      const allPosts = postsRes.data.posts || [];
      setPinnedPosts(allPosts.filter(p => p.is_pinned === true)); 
      setFeaturedPosts(allPosts.filter(p => p.is_featured === true).slice(0, 3)); 
      setCommunityPosts(allPosts.filter(p => p.is_pinned !== true && p.is_featured !== true));
      const membersRes = await api.get(`/communities/${communityId}/members`); setMembers(membersRes.data.members || []);
      if (user) {
        const membershipRes = await api.get(`/communities/${communityId}/membership`); setMembership(membershipRes.data);
      } else { setMembership({ isMember: false, role: null, details: null }); }
    } catch (err) { console.error("Fetch Community Data Error:", err.response?.data || err.message); setError(err.response?.data?.error || 'Failed to load community data.'); if (err.response?.status === 404) setCommunity(null);
    } finally { setLoading(false); }
  }, [communityId, user]);

  useEffect(() => { fetchCommunityData(); }, [fetchCommunityData]);

  // TODO Task Completed: Added loading state (actionInProgress) to the Join button
  const handleJoinCommunity = async () => { 
    if (!user) { onTriggerSignIn(); return; }
    setActionInProgress(true);
    try {
      await api.post(`/communities/${communityId}/join`);
      fetchCommunityData(); // Refetch all data to update UI
    } catch (err) { 
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to join community.");
    } finally {
      setActionInProgress(false);
    }
  };

  // TODO Task Completed: Added loading state (actionInProgress) to the Leave button
  const handleLeaveCommunity = async () => { 
    if (!user || !membership.isMember) return;
    if (membership.role === 'admin' && members.filter(m => m.role === 'admin').length <= 1) {
        alert("As the only admin, you cannot leave. Transfer ownership or delete the community (feature TODO)."); 
        return;
    }
    if (!window.confirm("Are you sure you want to leave this community?")) return;
    setActionInProgress(true);
    try {
      await api.delete(`/communities/${communityId}/leave`);
      fetchCommunityData(); // Refetch all data to update UI
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to leave community.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCommunityPostCreated = (newPost) => { 
    setCommunityPosts(prevPosts => [newPost, ...prevPosts]);
    setIsCreatePostModalOpen(false);
  };
  const handleViewCommunityPost = (post) => { setSelectedPostToView(post); setIsViewPostModalOpen(true); };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="text-gray-400 text-xl">Loading Community...</div></div>;
  if (error && !community && !loading) return <div className="text-center py-10 text-red-500 bg-red-100 p-4 rounded-md">{error} <Link to="/communities" className="text-sky-500 hover:underline ml-2">Go back</Link></div>;
  if (!community) return <div className="text-center py-10 text-gray-400">Community not found. <Link to="/communities" className="text-sky-400 hover:underline">Go back</Link></div>;
  
  const canPostInCommunity = membership.isMember;
  const isAdmin = membership.isMember && membership.role === 'admin';
  const faqItems = [
    { q: "How do I join this community?", a: "If you're signed in, click the 'Join Community' button! If you don't see it, you might already be a member." },
    { q: "What are the posting guidelines?", a: "Be respectful, share content relevant to the community's theme, and avoid spam. Admins may post specific rules." },
    { q: "How is content moderated?", a: "Community admins have tools to manage content and members to ensure a positive environment."}
  ];

  return (
    <div className="space-y-6 relative pb-24 pt-8">
      {/* Community Header with enhanced Join/Leave buttons */}
      <header className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 break-words">{community.community_name}</h1>
                <p className="text-gray-400 mb-1 text-sm">Located in: {community.location?.location_name || "N/A"}{community.location?.country ? `, ${community.location.country}` : ""}</p>
                <p className="text-sm text-gray-300 max-w-2xl">{community.description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto shrink-0">
                {!user && ( <button onClick={onTriggerSignIn} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg"> <LogIn size={16} className="mr-2"/> Sign in to Join </button> )}
                {user && !membership.isMember && ( <button onClick={handleJoinCommunity} disabled={actionInProgress} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"> {actionInProgress ? <Loader2 size={16} className="animate-spin mr-2"/> : <UserPlus size={16} className="mr-2"/>} {actionInProgress ? 'Joining...' : 'Join Community'} </button> )}
                {user && membership.isMember && ( <button onClick={handleLeaveCommunity} disabled={actionInProgress} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"> {actionInProgress ? <Loader2 size={16} className="animate-spin mr-2"/> : <UserMinus size={16} className="mr-2"/>} {actionInProgress ? 'Leaving...' : 'Leave Community'} </button> )}
                {isAdmin && ( <button disabled={actionInProgress} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg disabled:opacity-60"> <Settings size={16} className="mr-2"/> Admin Panel (TODO) </button> )}
            </div>
        </div>
      </header>
      
      {/* ... The rest of the page layout (Members Bar, Pinned Posts, etc.) remains the same ... */}
       {members.length > 0 && (
        <section className="p-4 bg-gray-800/70 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                <Users size={20} className="mr-2 text-sky-400"/> Members <span className="text-xs text-gray-400 ml-1.5">({members.length})</span>
            </h2>
            <div className="flex overflow-x-auto space-x-3 pb-2 custom-scrollbar">
                {members.map(member => ( <MemberBarAvatar key={member.user_id} member={member} /> ))}
            </div>
        </section>
      )}

      {pinnedPosts.length > 0 && (
        <section className="space-y-3 p-4 bg-sky-900/30 rounded-lg border border-sky-700 shadow-md">
            <h2 className="text-xl font-semibold text-sky-200 flex items-center mb-3">
                <PinIcon size={20} className="mr-2 text-yellow-300 transform -rotate-45"/> Pinned
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} isPinned={true} />)}
            </div>
        </section>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <aside className="w-full lg:w-1/4 xl:w-1/5 space-y-4 order-2 lg:order-1 shrink-0">
          <div className="bg-gray-800 p-4 rounded-lg shadow-md sticky top-24">
            <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                <HelpCircle size={18} className="mr-2 text-green-400"/> FAQ
            </h3>
            <div className="space-y-3 max-h-[calc(100vh-15rem)] overflow-y-auto custom-scrollbar pr-1">
                {faqItems.map((item, index) => (
                    <details key={index} className="text-sm group">
                        <summary className="font-medium text-gray-200 hover:text-sky-300 cursor-pointer list-none flex justify-between items-center p-2 rounded hover:bg-gray-700/50">
                            <span>{item.q}</span>
                            <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </summary>
                        <p className="text-gray-400 mt-1 pl-3 py-1 border-l-2 border-gray-700">{item.a}</p>
                    </details>
                ))}
            </div>
          </div>
        </aside>

        <main className="w-full lg:flex-1 space-y-6 order-1 lg:order-2">
          {!user && !canPostInCommunity && ( <p className="text-sm text-gray-400 text-center py-4"><button onClick={onTriggerSignIn} className="text-sky-400 hover:underline">Sign in</button> to join and post.</p> )}
          {user && !canPostInCommunity && ( <p className="text-sm text-gray-400 text-center py-4">Join this community to create posts.</p> )}
          
          {communityPosts.length > 0 ? (
            <div className="space-y-6">
              {communityPosts.map(post => (
                   <div key={post.post_id} className="max-w-xl mx-auto w-full">
                       <CommunityPostCard post={post} onPostClick={handleViewCommunityPost} />
                  </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 bg-gray-800/50 p-8 rounded-lg text-center min-h-[200px] flex flex-col justify-center items-center">
                <MessageCircle size={48} className="text-gray-600 mb-4"/>
                <p className="text-lg">
                    { (pinnedPosts.length > 0 || featuredPosts.length > 0) && communityPosts.length === 0 ? "No other posts in the feed yet." : 
                     (canPostInCommunity ? "It's quiet here... Be the first to contribute!" : "No posts in this community yet.")
                    }
                </p>
            </div>
          )}
        </main>

        <aside className="w-full lg:w-1/4 xl:w-1/5 space-y-4 order-3 lg:order-3 shrink-0">
          <div className="bg-gray-800 p-4 rounded-lg shadow-md sticky top-24">
            <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                <Info size={18} className="mr-2 text-sky-400"/> About Community
            </h3>
            <p className="text-sm text-gray-300 whitespace-pre-line mb-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">{community.description}</p>
            <p className="text-xs text-gray-400">Created: {new Date(community.created_at).toLocaleDateString()}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-md sticky top-[calc(18rem+env(safe-area-inset-top,0px))] md:top-[calc(18rem)]"> 
            <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                <Star size={18} className="mr-2 text-yellow-400"/> Featured
            </h3>
            {featuredPosts.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {featuredPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} isFeatured={true}/>)}
                </div>
            ) : (
                <p className="text-sm text-gray-400">No featured posts yet.</p>
            )}
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
      <ViewCommunityPostModal open={isViewPostModalOpen} onClose={() => setIsViewPostModalOpen(false)} post={selectedPostToView} />

      <FloatingActionButtons 
        canContribute={canPostInCommunity}
        onCreatePostClick={() => setIsCreatePostModalOpen(true)}
      /> 
    </div>
  );
}
