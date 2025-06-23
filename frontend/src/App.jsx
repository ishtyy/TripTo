import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookTripPage from "./pages/BookTripPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import CommunityDetailsPage from "./pages/CommunityDetailsPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import SignInModal from "./components/SignInModal.jsx";
import SignUpModal from "./components/SignUpModal.jsx";
import BlogModal from "./components/BlogModal.jsx";
import CreateCommunityModal from "./components/CreateCommunityModal.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = () => setDataVersion(v => v + 1);

  // This function now accepts an optional message
  const performLogout = useCallback((message) => {
    localStorage.removeItem("tripto_user");
    localStorage.removeItem("tripto_token");
    setUser(null);
    if (message) {
      // Store a message to be displayed on the homepage after redirect
      sessionStorage.setItem('redirectMessage', message);
    }
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    // This handler will be called by the event dispatched from api.js
    const handleAuthExpired = () => {
      performLogout('Your session has expired. Please sign in again.');
    };

    window.addEventListener("auth-expired", handleAuthExpired);

    const storedUser = localStorage.getItem("tripto_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { performLogout(); }
    }
    
    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [performLogout]);

  const handleAuthSuccess = (loggedInUser, token) => {
    localStorage.setItem("tripto_user", JSON.stringify(loggedInUser));
    localStorage.setItem("tripto_token", token);
    setUser(loggedInUser);
    setShowSignInModal(false);
    setShowSignUpModal(false);
  };
  
  const handleSignOut = () => { performLogout(); };
  const triggerSignIn = () => { setShowSignUpModal(false); setShowSignInModal(true); };
  const triggerSignUp = () => { setShowSignInModal(false); setShowSignUpModal(true); };

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout user={user} onSignOut={handleSignOut} onTriggerSignIn={triggerSignIn} onTriggerSignUp={triggerSignUp} />}>
          <Route index element={<HomePage user={user} onTriggerSignIn={triggerSignIn} onOpenBlogModal={() => setIsBlogModalOpen(true)} dataVersion={dataVersion} />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="book-trip" element={<BookTripPage />} />
          <Route path="profile/:userId" element={<ProfilePage loggedInUser={user} />} />
          <Route path="profile" element={user ? <Navigate to={`/profile/${user.user_id}`} replace /> : <Navigate to="/" replace />} />
          <Route path="communities" element={<CommunityPage user={user} onTriggerSignIn={triggerSignIn} onOpenCreateCommunityModal={() => setIsCreateCommunityModalOpen(true)} dataVersion={dataVersion} />} />
          <Route path="communities/:communityId" element={<CommunityDetailsPage user={user} onTriggerSignIn={triggerSignIn} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <SignInModal open={showSignInModal} onClose={() => setShowSignInModal(false)} onSuccess={handleAuthSuccess} />
      <SignUpModal open={showSignUpModal} onClose={() => setShowSignUpModal(false)} onSuccess={handleAuthSuccess} />
      <BlogModal open={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} onPostCreated={refreshData} user={user} onTriggerSignIn={triggerSignIn} />
      <CreateCommunityModal open={isCreateCommunityModalOpen} onClose={() => setIsCreateCommunityModalOpen(false)} onCommunityCreated={refreshData} user={user} onTriggerSignIn={triggerSignIn} />
    </>
  );
}