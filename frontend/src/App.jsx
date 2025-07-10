import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { BookingProvider } from "./context/BookingContext";

// Layout & Core Pages
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookTripPage from "./pages/BookTripPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import CommunityDetailsPage from "./pages/CommunityDetailsPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";

// Modals
import SignInModal from "./components/auth/SignInModal.jsx";
import SignUpModal from "./components/auth/SignUpModal.jsx";
import BlogModal from "./components/blog/BlogModal.jsx";
import CommunityCreateModal from "./components/community/CommunityCreateModal.jsx";
import ViewPostModal from "./components/blog/ViewPostModal.jsx";
import BookingModal from "./components/booking/BookingModal";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [postToView, setPostToView] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = () => setDataVersion(v => v + 1);

  const performLogout = useCallback((message) => {
    localStorage.removeItem("tripto_user");
    localStorage.removeItem("tripto_token");
    setUser(null);
    if (message) sessionStorage.setItem('redirectMessage', message);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const handleAuthExpired = () => performLogout('Your session has expired. Please sign in again.');
    window.addEventListener("auth-expired", handleAuthExpired);
    const storedUser = localStorage.getItem("tripto_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { performLogout(); }
    }
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [performLogout]);

  const handleAuthSuccess = (loggedInUser, token) => {
    localStorage.setItem("tripto_user", JSON.stringify(loggedInUser));
    localStorage.setItem("tripto_token", token);
    setUser(loggedInUser);
    setShowSignInModal(false);
    setShowSignUpModal(false);
  };
  
  const handleSignOut = () => performLogout();
  const triggerSignIn = () => { setShowSignUpModal(false); setShowSignInModal(true); };
  const triggerSignUp = () => { setShowSignInModal(false); setShowSignUpModal(true); };

  return (
    <>
      <BookingProvider>
        <Routes>
          <Route 
            path="/"
            element={
              <Layout 
                user={user} 
                onSignOut={handleSignOut} 
                onTriggerSignIn={triggerSignIn} 
                onTriggerSignUp={triggerSignUp} 
              />
            }
          >
            <Route index element={<HomePage user={user} onTriggerSignIn={triggerSignIn} onOpenBlogModal={() => setIsBlogModalOpen(true)} onViewPost={(post) => setPostToView(post)} dataVersion={dataVersion} />} />
            <Route path="explore" element={<ExplorePage onViewPost={(post) => setPostToView(post)} />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="book-trip" element={<BookTripPage />} />
            <Route path="profile/:userId" element={<ProfilePage loggedInUser={user} onViewPost={(post) => setPostToView(post)} />} />
            <Route path="profile" element={user ? <Navigate to={`/profile/${user.user_id}`} replace /> : <Navigate to="/" replace />} />
            <Route path="communities" element={<CommunityPage user={user} onTriggerSignIn={triggerSignIn} onOpenCreateCommunityModal={() => setIsCreateCommunityModalOpen(true)} dataVersion={dataVersion} />} />
            <Route path="communities/:communityId" element={<CommunityDetailsPage user={user} onTriggerSignIn={triggerSignIn} onViewPost={(post) => setPostToView(post)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        
        <BookingModal />
      </BookingProvider>

      <SignInModal open={showSignInModal} onClose={() => setShowSignInModal(false)} onSuccess={handleAuthSuccess} />
      <SignUpModal open={showSignUpModal} onClose={() => setShowSignUpModal(false)} onSuccess={handleAuthSuccess} />
      <BlogModal open={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} onPostCreated={refreshData} user={user} onTriggerSignIn={triggerSignIn} />
      <CommunityCreateModal open={isCreateCommunityModalOpen} onClose={() => setIsCreateCommunityModalOpen(false)} onCommunityCreated={refreshData} user={user} onTriggerSignIn={triggerSignIn} />
      <ViewPostModal open={!!postToView} onClose={() => setPostToView(null)} post={postToView} loggedInUser={user} />
    </>
  );
}