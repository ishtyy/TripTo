import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
    // CORRECTED LINE: Added 'User as UserIcon' to the import list
    Users, LogIn, UserPlus, UserMinus,
    MessageCircle, Star, Pin as PinIcon, User as UserIcon, Info, Loader2, Settings
} from 'lucide-react';
import CommunityPostCreateModal from '../components/community/CommunityPostCreateModal.jsx';
import CommunityViewPostModal from '../components/community/CommunityPostViewModal.jsx';
import FloatingActionButtons from '../components/common/FloatingActionButtons.jsx';


const CommunityPostCard = ({ post, onPostClick, isFeatured, isPinned }) => (
  <div
    onClick={() => onPostClick(post)}
    className={`p-5 rounded-xl shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[180px] hover:shadow-2xl hover:scale-[1.02] border-2
      ${isPinned ? 'bg-indigo-900/50 border-indigo-500 hover:bg-indigo-900/80' :
       isFeatured ? 'bg-purple-900/50 border-purple-500 hover:bg-purple-900/80' :
       'bg-gray-900/80 border-transparent hover:border-purple-600 hover:shadow-purple-600/20'}`}
  >
    <div>
      <h4
        className={`font-bold group-hover:text-white mb-2 truncate text-lg
          ${isPinned ? 'text-indigo-300' : isFeatured ? 'text-purple-300' : 'text-gray-100 group-hover:text-purple-300'}`}
        title={post.title}
      >
        {post.title}
      </h4>
      <p className="text-sm text-gray-400 group-hover:text-gray-300 line-clamp-3 mb-2">{post.content}</p>
    </div>
    <div className="text-xs text-gray-500 group-hover:text-gray-400 flex justify-between items-center mt-auto pt-3 border-t border-gray-700/60">
      <span className="flex items-center gap-1.5">
        <UserIcon size={12} className="flex-shrink-0"/>
        <span className="truncate">{post.user_profile?.username || 'Unknown'}</span>
      </span>
      <span>{new Date(post.created_at).toLocaleDateString()}</span>
    </div>
  </div>
);

const MemberBarAvatar = ({ member }) => {
    const username = member.user_profile?.username || 'User';
    const avatarUrl = member.user_profile?.profile_picture_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(username.split(' ').map(n=>n[0]).join('').substring(0,2))}&background=1f2937&color=E5E7EB&size=48&font-size=0.45&bold=true&format=svg`;
    return (
        <Link
            to={`/profile/${member.user_id}`}
            className="flex flex-col items-center text-center w-20 shrink-0 group p-1 hover:bg-gray-800/70 rounded-md transition-colors"
            title={username}
        >
            <img src={avatarUrl} alt={username} className="w-12 h-12 bg-gray-800 rounded-full mb-1 border-2 border-gray-700 group-hover:border-purple-500 transition-all object-cover"/>
            <span className="text-xs text-gray-400 group-hover:text-purple-400 truncate w-full">{username}</span>
            {member.role === 'admin' && <span className="text-[10px] text-purple-400 font-bold">Admin</span>}
        </Link>
    );
};


export default function CommunityDetailsPage({ user, onTriggerSignIn }) {
  const { communityId } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState({ isMember: false, role: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedPostToView, setSelectedPostToView] = useState(null);

  const maxVisibleMembers = 10;

  const fetchCommunityData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const communityRes = await api.get(`/communities/${communityId}`);
      if (!communityRes.data || !communityRes.data.community) {
        throw new Error("Community not found");
      }
      setCommunity(communityRes.data.community);

      const [postsRes, membersRes] = await Promise.all([
        api.get(`/community-posts?communityId=${communityId}`),
        api.get(`/communities/${communityId}/members`),
      ]);
      setPosts(postsRes.data.posts || []);
      setMembers(membersRes.data.members || []);

      if (user) {
        const membershipRes = await api.get(`/communities/${communityId}/membership`);
        setMembership(membershipRes.data);
      } else {
        setMembership({ isMember: false, role: null });
      }
    } catch (err) {
      console.error("Fetch Community Data Error:", err);
      setError("Could not load community data. It may not exist or an error occurred.");
    } finally {
      setLoading(false);
    }
  }, [communityId, user]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);
  
  const handleCommunityPostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setIsCreatePostModalOpen(false);
  };
  
  const handleViewCommunityPost = (post) => {
    setSelectedPostToView(post);
  };
  
  const handleJoinCommunity = async () => {
    if (!user) { onTriggerSignIn(); return; }
    setActionInProgress(true);
    try { await api.post(`/communities/${communityId}/join`); fetchCommunityData(); }
    catch (err) { alert(err.response?.data?.message || "Failed to join community."); }
    finally { setActionInProgress(false); }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !membership.isMember) return;
    if (membership.role === 'admin' && members.filter(m => m.role === 'admin').length <= 1) {
        alert("As the only admin, you cannot leave. Please transfer ownership first."); return;
    }
    if (!window.confirm("Are you sure you want to leave this community?")) return;
    setActionInProgress(true);
    try { await api.delete(`/communities/${communityId}/leave`); fetchCommunityData(); }
    catch (err) { alert(err.response?.data?.error || "Failed to leave community."); }
    finally { setActionInProgress(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-purple-500" size={48} /></div>;
  if (error) return <div className="text-center py-10 text-red-400 bg-red-900/20 p-4 rounded-md">{error}</div>;
  if (!community) return <div className="text-center py-10 text-gray-400">Community not found.</div>;

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const featuredPosts = posts.filter(p => p.is_featured && !p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned && !p.is_featured);
  const canPostInCommunity = membership.isMember;
  const isAdmin = membership.isMember && membership.role === 'admin';

  return (
      <div className="space-y-12 animate-fade-in-up">
    <div className="space-y-8 relative pb-24">
      <header className="bg-gray-900/50 p-6 rounded-xl shadow-2xl border border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 break-words">{community.community_name}</h1>
                <p className="text-purple-400 mb-1 text-sm">Located in: {community.location?.location_name || "N/A"}{community.location?.country ? `, ${community.location.country}` : ""}</p>
                <p className="text-base text-gray-300 max-w-2xl">{community.description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto shrink-0">
                {!user && ( <button onClick={onTriggerSignIn} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40"> <LogIn size={16} className="mr-2"/> Sign in to Join </button> )}
                {user && !membership.isMember && ( <button onClick={handleJoinCommunity} disabled={actionInProgress} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 disabled:opacity-50"> {actionInProgress ? <Loader2 size={16} className="animate-spin mr-2"/> : <UserPlus size={16} className="mr-2"/>} {actionInProgress ? 'Joining...' : 'Join Community'} </button> )}
                {user && membership.isMember && ( <button onClick={handleLeaveCommunity} disabled={actionInProgress} className="w-full sm:w-auto bg-red-800 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors shadow-lg shadow-red-800/20 hover:shadow-red-800/40 disabled:opacity-50"> {actionInProgress ? <Loader2 size={16} className="animate-spin mr-2"/> : <UserMinus size={16} className="mr-2"/>} {actionInProgress ? 'Leaving...' : 'Leave'} </button> )}
                {isAdmin && ( <button disabled={actionInProgress} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors shadow-md disabled:opacity-60"> <Settings size={16} className="mr-2"/> Admin </button> )}
            </div>
        </div>
      </header>
      
      {members.length > 0 && (
        <section className="p-4 bg-gray-900/70 rounded-lg shadow-md border border-gray-800">
            <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
                <Users size={20} className="mr-2 text-purple-400"/> Members <span className="text-xs text-gray-400 ml-1.5">({members.length})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
                {members.slice(0, maxVisibleMembers).map(member => ( <MemberBarAvatar key={member.user_id} member={member} /> ))}
                {members.length > maxVisibleMembers && (
                    <div className="flex flex-col items-center justify-center text-center w-20 h-[88px] p-1 bg-gray-800 rounded-md border-2 border-dashed border-gray-700 cursor-pointer hover:bg-gray-700/80 hover:border-purple-500 transition-colors" title="View all members">
                        <span className="font-bold text-purple-400 text-lg">+{members.length - maxVisibleMembers}</span>
                        <span className="text-xs text-gray-400">more</span>
                    </div>
                )}
            </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="lg:col-span-8 space-y-6">
          {pinnedPosts.length > 0 && (
            <section className="space-y-4 p-4 bg-indigo-900/30 rounded-lg border border-indigo-700">
              <h2 className="text-xl font-semibold text-indigo-200 flex items-center"><PinIcon size={20} className="mr-2 transform -rotate-45"/> Pinned</h2>
              <div className="space-y-4">
                {pinnedPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} isPinned />)}
              </div>
            </section>
          )}

          {regularPosts.length > 0 ? (
            <div className="space-y-4">
              {regularPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} />)}
            </div>
          ) : (
             posts.length === 0 && <div className="text-gray-400 bg-gray-900/50 p-8 rounded-lg text-center min-h-[200px] flex flex-col justify-center items-center">
                <MessageCircle size={48} className="text-gray-600 mb-4"/>
                <p className="text-lg">No posts in this community yet.</p>
                {canPostInCommunity && <p className="text-sm text-gray-500">Be the first one to contribute!</p>}
            </div>
          )}
        </main>
        
        <aside className="lg:col-span-4 space-y-6">
          <div className="p-5 bg-gray-900/80 border border-gray-800 rounded-xl sticky top-24">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Info size={18} className="mr-2 text-purple-400"/> About</h3>
            <p className="text-sm text-gray-300">{community.description}</p>
          </div>
          {featuredPosts.length > 0 && (
             <div className="p-5 bg-gray-900/80 border border-gray-800 rounded-xl sticky top-56">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Star size={18} className="mr-2 text-cyan-400"/> Featured</h3>
                <div className="space-y-3">
                    {featuredPosts.map(post => <CommunityPostCard key={post.post_id} post={post} onPostClick={handleViewCommunityPost} isFeatured />)}
                </div>
            </div>
          )}
        </aside>
      </div>

      {isCreatePostModalOpen && <CommunityPostCreateModal open={isCreatePostModalOpen} onClose={() => setIsCreatePostModalOpen(false)} user={user} communityId={community.community_id} onPostCreated={handleCommunityPostCreated} onTriggerSignIn={onTriggerSignIn} />}
      <CommunityViewPostModal open={!!selectedPostToView} onClose={() => setSelectedPostToView(null)} post={selectedPostToView} />
      <FloatingActionButtons canContribute={canPostInCommunity} onCreatePostClick={() => setIsCreatePostModalOpen(true)} />
    </div>
    </div>
  );
}