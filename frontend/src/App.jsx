import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

// Layout & Core Pages
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookTripPage from "./pages/BookTripPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import CommunityDetailsPage from "./pages/CommunityDetailsPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";

// Modals
import SignInModal from "./components/SignInModal.jsx";
import SignUpModal from "./components/SignUpModal.jsx";
import BlogModal from "./components/BlogModal.jsx";
import CreateCommunityModal from "./components/CreateCommunityModal.jsx";


export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // State for authentication modals
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  
  // State for creation modals is now managed at the top level to fix positioning bugs
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);

  // This state is used to trigger data re-fetches on pages after something is created
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = () => setDataVersion(v => v + 1);

  const performLogout = useCallback(() => {
    localStorage.removeItem("tripto_user");
    localStorage.removeItem("tripto_token");
    setUser(null);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const storedUser = localStorage.getItem("tripto_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        performLogout();
      }
    }
  }, [performLogout]);

  const handleAuthSuccess = (loggedInUser, token) => {
    localStorage.setItem("tripto_user", JSON.stringify(loggedInUser));
    localStorage.setItem("tripto_token", token);
    setUser(loggedInUser);
    setShowSignInModal(false);
    setShowSignUpModal(false);
  };
  
  const handleSignOut = () => {
    performLogout();
  };

  const triggerSignIn = () => {
    setShowSignUpModal(false);
    setShowSignInModal(true);
  };

  const triggerSignUp = () => {
    setShowSignInModal(false);
    setShowSignUpModal(true);
  };

  return (
    <>
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
          <Route 
            index 
            element={<HomePage 
                user={user} 
                onTriggerSignIn={triggerSignIn} 
                onOpenBlogModal={() => setIsBlogModalOpen(true)}
                dataVersion={dataVersion}
            />} 
          />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="book-trip" element={<BookTripPage />} />
          
          <Route path="profile/:userId" element={<ProfilePage loggedInUser={user} />} />
          <Route 
            path="profile" 
            element={user ? <Navigate to={`/profile/${user.user_id}`} replace /> : <Navigate to="/" replace />} 
          />

          <Route 
            path="communities" 
            element={<CommunityPage 
                user={user} 
                onTriggerSignIn={triggerSignIn} 
                onOpenCreateCommunityModal={() => setIsCreateCommunityModalOpen(true)}
                dataVersion={dataVersion}
            />} 
          />
          <Route path="communities/:communityId" element={<CommunityDetailsPage user={user} onTriggerSignIn={triggerSignIn} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* All modals are rendered here at the top level to ensure they are always centered correctly */}
      <SignInModal open={showSignInModal} onClose={() => setShowSignInModal(false)} onSuccess={handleAuthSuccess} />
      <SignUpModal open={showSignUpModal} onClose={() => setShowSignUpModal(false)} onSuccess={handleAuthSuccess} />

      <BlogModal 
        open={isBlogModalOpen} 
        onClose={() => setIsBlogModalOpen(false)} 
        onPostCreated={() => {
            setIsBlogModalOpen(false);
            refreshData(); // Refresh page data after creation
        }}
        user={user} 
        onTriggerSignIn={triggerSignIn} 
      />

      <CreateCommunityModal 
        open={isCreateCommunityModalOpen} 
        onClose={() => setIsCreateCommunityModalOpen(false)} 
        onCommunityCreated={() => {
            setIsCreateCommunityModalOpen(false);
            refreshData(); // Refresh page data after creation
        }}
        user={user} 
        onTriggerSignIn={triggerSignIn} 
      />
    </>
  );
}