import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { BookingProvider } from "./context/BookingContext";
import { Toaster } from "react-hot-toast";

// --- Layouts & Core Pages ---
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookTripPage from "./pages/BookTripPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import CommunityDetailsPage from "./pages/CommunityDetailsPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import MessagingPage from "./pages/MessagingPage.jsx";

// --- Admin Imports ---
import AdminLayout from "./components/layout/AdminLayout.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminPostsPage from './pages/admin/AdminPostsPage.jsx';
import AdminCommunitiesPage from './pages/admin/AdminCommunitiesPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminRoute from "./components/auth/AdminRoute.jsx";

// --- Modals ---
import SignInModal from "./components/auth/SignInModal.jsx";
import SignUpModal from "./components/auth/SignUpModal.jsx";
import BlogModal from "./components/blog/BlogModal.jsx";
import CommunityCreateModal from "./components/community/CommunityCreateModal.jsx";
import ViewPostModal from "./components/blog/ViewPostModal.jsx";
import CascadeModal from "./components/blog/CascadeModal.jsx";
import BookingModal from "./components/booking/BookingModal";

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // State for all modals
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
    const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
    const [postToView, setPostToView] = useState(null);
    const [postToCascade, setPostToCascade] = useState(null);
    const [dataVersion, setDataVersion] = useState(0);
    const refreshData = () => setDataVersion(v => v + 1);

    const performLogout = useCallback((isAdmin = false) => {
        localStorage.removeItem("tripto_user");
        localStorage.removeItem("tripto_token");
        setUser(null);
        navigate(isAdmin ? "/admin/login" : "/");
    }, [navigate]);

    useEffect(() => {
        const storedUser = localStorage.getItem("tripto_user");
        if (storedUser) {
            try { 
                setUser(JSON.parse(storedUser)); 
            } catch (e) { 
                console.error("Failed to parse user from storage", e);
                performLogout(); 
            }
        }
        setLoading(false); // Auth check is complete
    }, [performLogout]);

    const handleAuthSuccess = (loggedInUser, token) => {
        localStorage.setItem("tripto_user", JSON.stringify(loggedInUser));
        localStorage.setItem("tripto_token", token);
        setUser(loggedInUser);
        setShowSignInModal(false);
        setShowSignUpModal(false);
    };
    
    const handleAdminAuthSuccess = (adminUser, token) => {
        localStorage.setItem("tripto_user", JSON.stringify(adminUser));
        localStorage.setItem("tripto_token", token);
        setUser(adminUser);
    };

    const handleSignOut = () => performLogout();
    const handleAdminSignOut = () => performLogout(true);
    const triggerSignIn = () => { setShowSignUpModal(false); setShowSignInModal(true); };
    const triggerSignUp = () => { setShowSignInModal(false); setShowSignUpModal(true); };

    return (
        <>
            <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                  },
                }}
            />
            <BookingProvider>
                <Routes>
                    {/* Public route for the admin login page */}
                    <Route path="/admin/login" element={<AdminLoginPage onAdminLogin={handleAdminAuthSuccess} />} />

                    {/* Protected Admin Studio routes */}
                    <Route path="/admin/*" element={<AdminRoute user={user} loading={loading} />}>
                        <Route element={<AdminLayout onSignOut={handleAdminSignOut} />}>
                            <Route index element={<AdminDashboardPage />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="posts" element={<AdminPostsPage />} />
                            <Route path="communities" element={<AdminCommunitiesPage />} />
                            <Route path="bookings" element={<AdminBookingsPage />} />
                        </Route>
                    </Route>

                    {/* Main User-Facing Application Routes */}
                    <Route 
                        path="/*" // This will match every other path
                        element={
                            <Layout 
                                user={user} 
                                onSignOut={handleSignOut} 
                                onTriggerSignIn={triggerSignIn}
                                onTriggerSignUp={triggerSignUp}
                            />
                        }
                    >
                        <Route index element={<HomePage user={user} onTriggerSignIn={triggerSignIn} onOpenBlogModal={() => setIsBlogModalOpen(true)} onViewPost={setPostToView} onCascade={setPostToCascade} dataVersion={dataVersion} />} />
                        <Route path="explore" element={<ExplorePage onViewPost={setPostToView} onCascade={setPostToCascade} user={user} onTriggerSignIn={triggerSignIn} />} />
                        <Route path="search" element={<SearchResultsPage />} />
                        <Route path="book-trip" element={<BookTripPage />} />
                        <Route path="profile/:userId" element={<ProfilePage loggedInUser={user} onViewPost={setPostToView} onCascade={setPostToCascade} onTriggerSignIn={triggerSignIn} />} />
                        <Route path="profile" element={user ? <Navigate to={`/profile/${user.user_id}`} replace /> : <Navigate to="/" replace />} />
                        <Route path="communities" element={<CommunityPage user={user} onTriggerSignIn={triggerSignIn} onOpenCreateCommunityModal={() => setIsCreateCommunityModalOpen(true)} dataVersion={dataVersion} />} />
                        <Route path="communities/:communityId" element={<CommunityDetailsPage user={user} onTriggerSignIn={triggerSignIn} />} />
                        <Route path="messages" element={<MessagingPage user={user} />}>
                            <Route path=":conversationId" element={<MessagingPage user={user} />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
                
                <BookingModal />
            </BookingProvider>

            <SignInModal open={showSignInModal} onClose={() => setShowSignInModal(false)} onSuccess={handleAuthSuccess} onSwitchToSignUp={triggerSignUp}/>
            <SignUpModal open={showSignUpModal} onClose={() => setShowSignUpModal(false)} onSuccess={handleAuthSuccess} onSwitchToSignIn={triggerSignIn}/>
            <BlogModal open={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} onPostCreated={refreshData} user={user} onTriggerSignIn={triggerSignIn} />
            <CommunityCreateModal open={isCreateCommunityModalOpen} onClose={() => setIsCreateCommunityModalOpen(false)} onCommunityCreated={refreshData} user={user} onTriggerSignIn={triggerSignIn} />
            <ViewPostModal open={!!postToView} onClose={() => setPostToView(null)} post={postToView} loggedInUser={user} onTriggerSignIn={triggerSignIn} onCascade={setPostToCascade} />
            <CascadeModal open={!!postToCascade} onClose={() => setPostToCascade(null)} parentPost={postToCascade} user={user} onTriggerSignIn={triggerSignIn} onPostCreated={refreshData} />
        </>
    );
}