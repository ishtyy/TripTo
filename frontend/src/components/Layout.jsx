// frontend/src/components/Layout.jsx
import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Bell, User, Globe, MapPin, BookOpen } from "lucide-react";
import TripToLogo from "../assets/tripto-logo.svg";

import SignInModal from "./SignInModal.jsx";
import SignUpModal from "./SignUpModal.jsx";

export default function Layout({ user, onSignOut, onLogin }) {
  const location = useLocation();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // Derive which tab is active, e.g. "/explore" → "explore"
  const activeTab = location.pathname.split("/")[1] || "explore";

  return (
    <div className="flex h-screen">
      {/* ---------- Sidebar ---------- */}
      <aside className="w-28 bg-gray-800 border-r border-gray-700 flex flex-col py-6 space-y-8">
        {/* Logo always at top */}
        <div className="flex justify-center">
          <Link to="/">
            <img src={TripToLogo} alt="TripTo" className="w-8 h-8" />
          </Link>
        </div>

        {/* Icons (left-aligned) */}
        <nav className="flex flex-col space-y-6 px-2">
          <Link
            to="/explore"
            className={`flex items-center space-x-2 px-1 ${
              activeTab === "explore"
                ? "text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Globe size={24} />
            <span className="hidden">Explore</span>
          </Link>
          <Link
            to="/communities"
            className={`flex items-center space-x-2 px-1 ${
              activeTab === "communities"
                ? "text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <MapPin size={24} />
            <span className="hidden">Communities</span>
          </Link>
          <Link
            to="/book-trip"
            className={`flex items-center space-x-2 px-1 ${
              activeTab === "book-trip"
                ? "text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BookOpen size={24} />
            <span className="hidden">Book</span>
          </Link>
          <Link
            to="/profile"
            className={`mt-auto flex items-center space-x-2 px-1 ${
              activeTab === "profile"
                ? "text-sky-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <User size={24} />
            <span className="hidden">Profile</span>
          </Link>
        </nav>
      </aside>

      {/* ---------- Main Area ---------- */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* On Home (/ or /explore), show the text “TripTo”; otherwise only the logo */}
            {location.pathname === "/explore" ||
            location.pathname === "/" ? (
              <>
                <img src={TripToLogo} alt="TripTo" className="w-8 h-8" />
                <span className="text-white text-2xl font-heading">TripTo</span>
              </>
            ) : (
              <img src={TripToLogo} alt="TripTo" className="w-8 h-8" />
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Inbox icon always on top bar */}
            <button className="relative text-gray-400 hover:text-gray-200">
              <Bell size={20} />
              {user && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 text-xs font-semibold text-red-100 bg-red-600 rounded-full">
                  3
                </span>
              )}
            </button>

            {!user ? (
              <>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="px-3 py-1 bg-ocean hover:bg-ocean/90 text-white rounded text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-3 py-1 bg-sunset hover:bg-sunset/90 text-white rounded text-sm"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={onSignOut}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm"
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        {/* Render the modals */}
        <SignInModal
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSuccess={onLogin}
        />
        <SignUpModal
          open={showSignUp}
          onClose={() => setShowSignUp(false)}
          onSuccess={onLogin}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
