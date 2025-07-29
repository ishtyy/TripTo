import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Edit, Users, Loader2, BookCheck, MapPin, UserPlus, UserCheck, MessageSquare, Newspaper, Gift } from 'lucide-react';

import BookingStatementModal from '../components/booking/BookingStatementModal';
import BlogPostCard from '../components/blog/BlogPostCard';

// ✅ FIX: All helper components are now defined OUTSIDE and BEFORE the main component.
// This resolves the 'StatCard is not defined' error.

const StatCard = ({ value, label }) => (
    <div className="text-center">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
    </div>
);

const BookingHistoryCard = ({ booking, onViewDetails }) => (
    <button 
        onClick={() => onViewDetails(booking.booking_id)}
        className="w-full text-left bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-cyan-600/50 transition-colors"
    >
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold text-white">{booking.items[0].title}</p>
                <p className="text-xs text-gray-400">ID: {booking.booking_id.slice(0, 8).toUpperCase()}</p>
            </div>
            <p className="text-xs text-gray-400">{new Date(booking.booked_at).toLocaleDateString()}</p>
        </div>
    </button>
);

const ProfileTab = ({ label, icon: Icon, isActive, onClick, badge = null }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-colors ${
            isActive 
                ? 'border-cyan-500 text-white' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
        }`}
    >
        <Icon size={16} />
        {label}
        {badge !== null && badge > 0 && (
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {badge}
            </span>
        )}
    </button>
);


// --- The Main Profile Page Component ---

export default function ProfilePage({ loggedInUser, onViewPost, onCascade, onTriggerSignIn }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingToView, setBookingToView] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = loggedInUser?.user_id === userId;

  useEffect(() => {
    async function fetchProfileData() {
        if (!userId) return;
        setLoading(true);
        setError('');
        try {
            const promises = [
                api.get(`/users/${userId}`),
                api.get(`/posts?user_id=${userId}`),
            ];
            
            if (isOwnProfile) {
                promises.push(api.get('/bookings/my-history'));
                promises.push(api.get(`/users/${userId}/communities`));
                promises.push(api.get('/coupons/my-coupons'));
            }
            const responses = await Promise.all(promises);
            
            const profileResponse = responses[0].data.user;
            setProfileData(profileResponse);
            setIsFollowing(profileResponse.is_following);
            setFollowersCount(parseInt(profileResponse.followers_count, 10));
            setUserPosts(responses[1].data.posts || []);
            
            if (isOwnProfile) {
                setBookingHistory(responses[2].data || []);
                setJoinedCommunities(responses[3].data.communities || []);
                if (responses[4] && responses[4].data.success) {
                    setUserCoupons(responses[4].data.coupons || []);
                }
            }
        } catch (err) {
            setError("Failed to load profile. This user may not exist.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    fetchProfileData();
  }, [userId, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!loggedInUser) { onTriggerSignIn(); return; }
    const originalFollowState = isFollowing;
    const originalFollowerCount = followersCount;
    setIsFollowing(!originalFollowState);
    setFollowersCount(originalFollowState ? originalFollowerCount - 1 : originalFollowerCount + 1);
    try {
        await api.post(`/users/${userId}/${originalFollowState ? 'unfollow' : 'follow'}`);
    } catch (err) {
        setIsFollowing(originalFollowState);
        setFollowersCount(originalFollowerCount);
    }
  };

  const handleStartConversation = async () => {
    if (!loggedInUser) { onTriggerSignIn(); return; }
    try {
      const { data } = await api.post('/messages/find-or-create', { recipientId: userId });
      navigate(`/messages/${data.conversation_id}`);
    } catch (err) {
      toast.error("Could not start a conversation.");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-cyan-500" size={40}/></div>;
  if (error) return <div className="text-center py-10 text-red-400">{error}</div>;
  if (!profileData) return <div className="text-center py-10 text-gray-400">User not found.</div>;
  
  return (
    <>
      <div className="space-y-8 animate-fade-in-up">
        <div className="p-8 bg-gray-900/80 border border-gray-800 rounded-2xl shadow-2xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <img src={profileData.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username)}&background=22d3ee&color=000&size=128&bold=true`} alt={`${profileData.username}'s avatar`} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-cyan-500 object-cover shadow-lg" />
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{profileData.username}</h1>
                    <p className="text-cyan-400 mt-2 text-lg">{profileData.email}</p>
                    <p className="text-gray-300 mt-4 text-base max-w-xl">{profileData.bio || "This user hasn't added a bio yet."}</p>
                    <div className="mt-6 flex items-center justify-center md:justify-start gap-3">
                        {isOwnProfile ? (
                            <button className="inline-flex items-center px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg"><Edit size={16} className="mr-2" /> Edit Profile</button>
                        ) : (
                            <>
                                <button onClick={handleFollowToggle} className={`inline-flex items-center px-5 py-2 rounded-lg font-semibold transition-colors ${isFollowing ? 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                                    {isFollowing ? <UserCheck size={16} className="mr-2"/> : <UserPlus size={16} className="mr-2"/>}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button onClick={handleStartConversation} className="inline-flex items-center px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg">
                                    <MessageSquare size={16} className="mr-2"/> Message
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-3 divide-x divide-gray-700">
                <StatCard value={userPosts.length} label="Posts" />
                <StatCard value={followersCount} label="Followers" />
                <StatCard value={parseInt(profileData.following_count, 10)} label="Following" />
            </div>
        </div>

        <div>
            <div className="border-b border-gray-800 flex items-center space-x-2">
                <ProfileTab label="Posts" icon={Newspaper} isActive={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                {isOwnProfile && (
                    <>
                        <ProfileTab label="My Bookings" icon={BookCheck} isActive={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
                        <ProfileTab label="My Communities" icon={Users} isActive={activeTab === 'communities'} onClick={() => setActiveTab('communities')} />
                        <ProfileTab label="My Coupons" icon={Gift} isActive={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} badge={userCoupons.filter(c => c.current_status === 'available').length} />
                    </>
                )}
            </div>
            <div className="mt-6">
                {activeTab === 'posts' && (
                    <section className="space-y-6">
                        {userPosts.length > 0 ? (
                            userPosts.map(post => <BlogPostCard key={post.post_id} post={post} user={loggedInUser} onTriggerSignIn={onTriggerSignIn} onViewPost={onViewPost} onCascade={onCascade} />)
                        ) : (
                            <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800"><p className="text-gray-400">No blog posts yet.</p></div>
                        )}
                    </section>
                )}
                {activeTab === 'bookings' && isOwnProfile && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bookingHistory.length > 0 ? (
                            bookingHistory.map(booking => <BookingHistoryCard key={booking.booking_id} booking={booking} onViewDetails={setBookingToView} />)
                        ) : <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800 md:col-span-2"><p className="text-gray-400">No booking history found.</p></div>}
                    </section>
                )}
                 {activeTab === 'communities' && isOwnProfile && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {joinedCommunities.length > 0 ? (
                            joinedCommunities.map(community => (
                                <Link to={`/communities/${community.community_id}`} key={community.community_id} className="flex items-center gap-3 p-4 bg-gray-900 hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-800">
                                    <MapPin size={18} className="text-gray-500" />
                                    <span className="font-semibold text-gray-300">{community.community_name}</span>
                                </Link>
                            ))
                        ) : <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800 md:col-span-3"><p className="text-gray-400">You haven't joined any communities yet.</p></div>}
                    </section>
                )}
                
                {activeTab === 'coupons' && isOwnProfile && (
                    <section className="space-y-4">
                        {userCoupons.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userCoupons.map(coupon => (
                                    <div key={coupon.coupon_id} className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-purple-300">{coupon.coupon_code}</h3>
                                                <p className="text-gray-300 text-sm">{coupon.title}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                coupon.current_status === 'available' ? 'bg-green-900/50 text-green-300 border border-green-600/30' :
                                                coupon.current_status === 'expired' ? 'bg-red-900/50 text-red-300 border border-red-600/30' :
                                                coupon.current_status === 'used' ? 'bg-gray-700/50 text-gray-400 border border-gray-600/30' :
                                                'bg-yellow-900/50 text-yellow-300 border border-yellow-600/30'
                                            }`}>
                                                {coupon.current_status}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm text-gray-400">
                                            <p>
                                                <strong className="text-gray-300">Discount:</strong>{' '}
                                                {coupon.discount_type === 'percentage' 
                                                    ? `${coupon.discount_value}% off` 
                                                    : `$${coupon.discount_value} off`}
                                                {coupon.max_discount_amount && ` (max $${coupon.max_discount_amount})`}
                                            </p>
                                            <p>
                                                <strong className="text-gray-300">Valid until:</strong>{' '}
                                                {new Date(coupon.valid_until).toLocaleDateString()}
                                            </p>
                                            <p>
                                                <strong className="text-gray-300">Usage:</strong>{' '}
                                                {coupon.times_used} / {coupon.usage_limit || '∞'}
                                            </p>
                                            <p>
                                                <strong className="text-gray-300">Applicable to:</strong>{' '}
                                                {coupon.applicable_to_flights && coupon.applicable_to_packages ? 'Flights & Packages' :
                                                 coupon.applicable_to_flights ? 'Flights only' :
                                                 coupon.applicable_to_packages ? 'Packages only' :
                                                 'All bookings'}
                                            </p>
                                            {coupon.description && (
                                                <p className="text-gray-500 text-xs mt-2">{coupon.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                                <Gift size={64} className="mx-auto mb-4 text-gray-600" />
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Coupons Yet</h3>
                                <p className="text-gray-400 mb-4">
                                    You don't have any coupons yet. Book packages to earn flight discount coupons!
                                </p>
                                <Link 
                                    to="/book-trip" 
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <Gift size={20} />
                                    Browse Packages
                                </Link>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
      </div>

      <BookingStatementModal 
        open={!!bookingToView} 
        onClose={() => setBookingToView(null)} 
        bookingId={bookingToView} 
      />
    </>
  );
}