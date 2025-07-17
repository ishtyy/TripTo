import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Users, UserPlus, UserMinus, Loader2, Info, ArrowUp, ArrowDown, MessageSquare, Feather, ShieldQuestion, Pin, Rss, ChevronDown, ArrowLeft } from 'lucide-react';

import { formatTimeAgo } from '../utils/formatTimeAgo';
import CommunityViewPostModal from '../components/community/CommunityPostViewModal';
import CommunityPostCreateModal from '../components/community/CommunityPostCreateModal';

// --- Sub-components for the Final, Polished Layout ---

const CommunityHeader = ({ community, onJoinLeave, isMember }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-gray-900/50 rounded-xl shadow-2xl border border-gray-800 relative overflow-hidden">
            <div 
                className="h-56 bg-gray-800 bg-cover bg-center relative"
                style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-4 left-4 text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors z-20"
                    title="Go Back"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>
            <div className="p-6 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start -mt-24">
                    <div className="flex items-end space-x-4">
                        <img
                            src={community.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.community_name)}&background=1a202c&color=fff&size=128&bold=true`}
                            alt={community.community_name}
                            className="w-32 h-32 rounded-full border-4 border-gray-900 bg-gray-900"
                        />
                        <div className="pb-2">
                            <h1 className="text-3xl font-bold text-white">{community.community_name}</h1>
                            <p className="text-gray-400">{community.member_count} members</p>
                        </div>
                    </div>
                    <button onClick={onJoinLeave} className={`btn shrink-0 mt-4 sm:mt-0 ${isMember ? 'btn-secondary' : 'bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg'}`}>
                        {isMember ? <><UserMinus className="mr-2"/>Joined</> : <><UserPlus className="mr-2"/>Join</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PostCard = ({ post, onVote, onCardClick }) => {
    const [voteCount, setVoteCount] = useState((post.upvote_count || 0) - (post.downvote_count || 0));
    const [userVote, setUserVote] = useState(post.user_vote);

    const handleVoteClick = (e, voteType) => {
        e.stopPropagation(); 
        const oldVote = userVote;
        const newVote = oldVote === voteType ? null : voteType;
        setUserVote(newVote);
        setVoteCount(prev => {
             if (newVote === 1) return oldVote === -1 ? prev + 2 : prev + 1;
             if (newVote === -1) return oldVote === 1 ? prev - 2 : prev - 1;
             if (oldVote === 1) return prev - 1;
             if (oldVote === -1) return prev + 1;
             return prev;
        });
        onVote(post.post_id, newVote);
    };

    return (
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 flex flex-col h-full hover:border-yellow-500/40 transition-all">
            <div className="p-5 flex-grow cursor-pointer" onClick={() => onCardClick(post)}>
                {post.is_pinned && <div className="text-xs text-yellow-400 flex items-center mb-2"><Pin size={14} className="mr-1"/> Pinned Post</div>}
                <div className="flex items-center space-x-3 mb-4">
                    <Link to={`/profile/${post.user_profile.user_id}`} onClick={e => e.stopPropagation()} className="flex-shrink-0">
                        <img src={post.user_profile.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user_profile.username)}`} alt={post.user_profile.username} className="w-10 h-10 rounded-full"/>
                    </Link>
                    <div>
                        <Link to={`/profile/${post.user_profile.user_id}`} onClick={e => e.stopPropagation()} className="font-semibold text-white hover:underline">{post.user_profile.username}</Link>
                        <p className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</p>
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2">{post.title}</h2>
            </div>
            <div className="bg-gray-800/40 px-5 py-3 flex justify-start items-center text-sm text-gray-400 border-t border-gray-800 space-x-4">
                <div className="flex items-center bg-gray-900/50 rounded-full">
                    <button onClick={(e) => handleVoteClick(e, 1)} className={`p-1.5 rounded-full transition-colors ${userVote === 1 ? 'text-yellow-400' : 'hover:bg-gray-700'}`}><ArrowUp size={16} /></button>
                    <span className="font-bold text-sm text-white px-2">{voteCount}</span>
                    <button onClick={(e) => handleVoteClick(e, -1)} className={`p-1.5 rounded-full transition-colors ${userVote === -1 ? 'text-blue-400' : 'hover:bg-gray-700'}`}><ArrowDown size={16} /></button>
                </div>
                <button onClick={() => onCardClick(post)} className="flex items-center space-x-1.5 hover:text-white transition-colors">
                    <MessageSquare size={16}/> 
                    <span>{post.comment_count || 0} comments</span>
                </button>
            </div>
        </div>
    );
};

const MembersTab = ({ members }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {members.map(member => (
            <Link to={`/profile/${member.user_id}`} key={member.user_id} className="bg-gray-800/50 p-4 rounded-lg flex flex-col items-center text-center border border-gray-800 hover:border-yellow-500/40 transition-all">
                <img src={member.user_profile.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user_profile.username)}`} alt={member.user_profile.username} className="w-20 h-20 rounded-full mb-3"/>
                <p className="font-semibold text-white">{member.user_profile.username}</p>
                <p className="text-xs text-yellow-400 uppercase">{member.role}</p>
            </Link>
        ))}
    </div>
);

const FaqItem = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-800 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-800 transition-colors">
                <h3 className="font-bold text-white">{question}</h3>
                <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-yellow-400' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-800">
                    <div className="prose prose-sm prose-invert text-gray-300 mt-2">{children}</div>
                </div>
            )}
        </div>
    );
};

const FaqTab = () => (
    <div className="space-y-4">
        <FaqItem question="What are the rules of this community?">
            <ol className="list-decimal list-inside space-y-2">
                <li>Be respectful.</li>
                <li>Keep discussions relevant.</li>
                <li>No spam or self-promotion.</li>
            </ol>
        </FaqItem>
    </div>
);

const FloatingContributeButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="fixed bottom-8 right-8 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full p-4 shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-200 z-40"
        title="Contribute"
    >
        <Feather size={24} />
    </button>
);


export default function CommunityDetailsPage({ user, onTriggerSignIn }) {
    const { communityId } = useParams();
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const detailsPromise = user ? api.get(`/communities/${communityId}/details`) : Promise.resolve({data: null});
            const postsPromise = api.get(`/community-posts`, { params: { communityId } });
            const membersPromise = api.get(`/communities/${communityId}/members`);
            const [detailsRes, postsRes, membersRes] = await Promise.all([detailsPromise, postsPromise, membersPromise]);
            
            setCommunity(detailsRes.data);
            setPosts(postsRes.data.posts || []);
            setAllMembers(membersRes.data.members || []);
        } catch (err) {
            toast.error("Could not load community data.");
        } finally {
            setLoading(false);
        }
    }, [communityId, user]);

    useEffect(() => { fetchPageData(); }, [fetchPageData]);
    
    const handleJoinLeave = async () => {
        if (!user) return onTriggerSignIn();
        const action = community.is_member ? 'leave' : 'join';
        const originalCommunity = { ...community };
        setCommunity(c => ({...c, is_member: !c.is_member, member_count: c.is_member ? c.member_count - 1 : c.member_count + 1}));
        try {
            await api({ method: action === 'join' ? 'post' : 'delete', url: `/communities/${communityId}/${action}` });
            toast.success(`Successfully ${action}ed the community!`);
        } catch (err) {
            toast.error(`Failed to ${action} community.`);
            setCommunity(originalCommunity);
        }
    };

    const handleVoteOnPost = useCallback(async (postId, voteType) => {
        if (!user) return onTriggerSignIn();
        try {
            await api.post(`/community-posts/${postId}/vote`, { vote_type: voteType });
        } catch (error) {
            toast.error("Vote failed to save.");
        }
    }, [user, onTriggerSignIn]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-yellow-400" size={48}/></div>;

    if (!user) return (
        <div className="text-center py-20 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-4">Access Restricted</h2>
            <p className="mb-6 text-gray-400">Please sign in to view this community.</p>
            <button onClick={onTriggerSignIn} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg">Sign In</button>
        </div>
    );
    
    if (!community) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-4">Community Not Found</h2>
        </div>
    );

    const pinnedPosts = posts.filter(p => p.is_pinned);
    const regularPosts = posts.filter(p => !p.is_pinned);

    const TabButton = ({ tabName, icon, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tabName ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <CommunityHeader community={community} onJoinLeave={handleJoinLeave} isMember={community.is_member}/>
            <div className="bg-gray-900/50 p-2 rounded-lg flex items-center space-x-2 border border-gray-800">
                <TabButton tabName="posts" icon={<Rss size={16}/>} label="Posts"/>
                <TabButton tabName="members" icon={<Users size={16}/>} label="Members"/>
                <TabButton tabName="about" icon={<Info size={16}/>} label="About"/>
                <TabButton tabName="faq" icon={<ShieldQuestion size={16}/>} label="Rules & FAQ"/>
            </div>

            {/* ✅ FIX: The entire main content area is now a single, flowing container */}
            <div className="space-y-6">
                {pinnedPosts.length > 0 && (
                     <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Pin size={16} className="mr-2 text-yellow-400"/> Pinned Posts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                           {pinnedPosts.map(post => <PostCard key={post.post_id} post={post} onCardClick={setSelectedPost} onVote={handleVoteOnPost} />)}
                        </div>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {regularPosts.map(post => <PostCard key={post.post_id} post={post} onCardClick={setSelectedPost} onVote={handleVoteOnPost} />)}
                    </div>
                )}
                {activeTab === 'members' && <MembersTab members={allMembers} />}
                {activeTab === 'about' && <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-800 text-gray-300 leading-relaxed">{community.description}</div>}
                {activeTab === 'faq' && <FaqTab />}
            </div>
            
            {user && community.is_member && (
                <FloatingContributeButton onClick={() => setIsCreateModalOpen(true)} />
            )}

            {isCreateModalOpen && <CommunityPostCreateModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} communityId={communityId} user={user} onPostCreated={(newPost) => setPosts(p => [newPost, ...p])}/>}
            {selectedPost && <CommunityViewPostModal open={!!selectedPost} onClose={() => { setSelectedPost(null); fetchPageData(); }} post={selectedPost} user={user} onTriggerSignIn={onTriggerSignIn} />}
        </div>
    );
}