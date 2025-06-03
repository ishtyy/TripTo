// frontend/src/App.jsx
import React, { useEffect, useState, useCallback } from "react"; // Added useCallback import
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
// import CreateCommunityPage from "./pages/CreateCommunityPage.jsx"; // Likely deprecated
import BookTripPage from "./pages/BookTripPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import CommunityDetailsPage from "./pages/CommunityDetailsPage.jsx";
import SignInModal from "./components/SignInModal.jsx";
import SignUpModal from "./components/SignUpModal.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate(); // For programmatic navigation

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Function to handle logout logic (can be called from multiple places)
  const performLogout = useCallback(() => {
    console.log("[App.jsx] Performing logout actions.");
    localStorage.removeItem("tripto_user");
    localStorage.removeItem("tripto_token");
    setUser(null);
    setShowSignInModal(false); // Ensure modals are closed
    setShowSignUpModal(false);
    // Optionally navigate to a public page like home or explore
    // navigate("/"); // Navigate to home after logout
  }, [navigate]);


  useEffect(() => {
    console.log("[App.jsx] App mounted. Checking for stored user.");
    const storedUser = localStorage.getItem("tripto_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("[App.jsx] Error parsing stored user, logging out:", e);
        performLogout(); // Clear corrupted data
      }
    } else {
      console.log("[App.jsx] No user found in localStorage.");
    }

    // Listener for auth-expired event from Axios interceptor
    const handleAuthExpired = () => {
      console.log("[App.jsx] 'auth-expired' event received. Logging out and prompting sign-in.");
      performLogout();
      // After logout, immediately prompt for sign-in.
      // Small delay to ensure state updates propagate if needed, though usually not necessary.
      setTimeout(() => {
        setShowSignInModal(true);
      }, 100); 
    };

    window.addEventListener("auth-expired", handleAuthExpired);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [performLogout]); // performLogout is memoized

  function handleSignOut() { // This is for explicit sign-out button
    performLogout();
  }

  function handleAuthSuccess(loggedInUser, token) {
    console.log("[App.jsx] Auth success. User:", loggedInUser);
    localStorage.setItem("tripto_user", JSON.stringify(loggedInUser));
    localStorage.setItem("tripto_token", token);
    setUser(loggedInUser);
    setShowSignInModal(false);
    setShowSignUpModal(false);
  }

  const triggerSignIn = () => {
    console.log("[App.jsx] triggerSignIn called.");
    setShowSignUpModal(false); 
    setShowSignInModal(true);
  };

  const triggerSignUp = () => {
    setShowSignInModal(false); 
    setShowSignUpModal(true);
  };

  const isHome = location.pathname === "/";

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              isHome={isHome}
              user={user}
              onSignOut={handleSignOut}
              onTriggerSignIn={triggerSignIn}
              onTriggerSignUp={triggerSignUp}
            />
          }
        >
          <Route index element={<HomePage user={user} onTriggerSignIn={triggerSignIn} />} />
          <Route path="explore" element={<ExplorePage user={user} />} />
          <Route path="book-trip" element={<BookTripPage user={user} />} />
          <Route
            path="profile"
            element={user ? <ProfilePage user={user} /> : <Navigate to="/" replace />}
          />
          <Route
            path="communities"
            element={<CommunityPage user={user} onTriggerSignIn={triggerSignIn} />}
          />
          <Route 
            path="communities/:communityId" 
            element={<CommunityDetailsPage user={user} onTriggerSignIn={triggerSignIn} />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <SignInModal
        open={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={handleAuthSuccess}
      />
      <SignUpModal
        open={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
