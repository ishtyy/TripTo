// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import CreateCommunityPage from "./pages/CreateCommunityPage.jsx";
import BookTripPage from "./pages/BookTripPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("tripto_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  function handleSignOut() {
    localStorage.removeItem("tripto_user");
    localStorage.removeItem("tripto_token");
    setUser(null);
  }

  // called by SignIn/SignUp modals on success:
  function handleLogin(newUser) {
    setUser(newUser);
  }

  const isHome = location.pathname === "/";

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout
            isHome={isHome}
            user={user}
            onSignOut={handleSignOut}
            onLogin={handleLogin}
          />
        }
      >
        <Route index element={<HomePage user={user} />} />
        <Route path="explore" element={<ExplorePage user={user} />} />
        <Route
          path="create-community"
          element={<CreateCommunityPage user={user} />}
        />
        <Route path="book-trip" element={<BookTripPage user={user} />} />
        <Route
          path="profile"
          element={user ? <ProfilePage user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="communities"
          element={user ? <CommunityPage user={user} /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
