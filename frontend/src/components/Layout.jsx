// frontend/src/components/Layout.jsx
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Bell, User, Globe, MapPin, BookOpen, Home } from "lucide-react"; // Added Home icon
import TripToLogo from "../assets/tripto-logo.svg";

export default function Layout({ user, onSignOut, onTriggerSignIn, onTriggerSignUp }) {
  const location = useLocation();
  // Determine active tab based on the current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeTab = pathSegments[0] || "home"; // Default to 'home' for '/'

  return (
    <div className="flex h-screen">
      <aside className="w-20 md:w-24 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 space-y-1">
        <div className="flex justify-center mb-6">
          <Link to="/" title="Go to Homepage"> {/* Always link to "/" */}
            <img src={TripToLogo} alt="TripTo" className="w-8 h-8 md:w-10 md:h-10" />
          </Link>
        </div>

        <nav className="flex flex-col items-center space-y-1 w-full px-2">
          {[
            { path: "/", icon: Home, label: "Home", tab: "home" }, // Home link
            { path: "/explore", icon: Globe, label: "Explore", tab: "explore" },
            { path: "/communities", icon: MapPin, label: "Communities", tab: "communities" },
            { path: "/book-trip", icon: BookOpen, label: "Book", tab: "book-trip" },
          ].map((item) => (
            <Link
              key={item.tab}
              to={item.path}
              className={`flex flex-col items-center p-3 rounded-lg w-full text-center transition-colors duration-200 ${
                activeTab === item.tab
                  ? "text-sky-400 bg-gray-700"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              }`}
              title={item.label}
            >
              <item.icon size={22} />
              <span className="text-[10px] mt-1 md:text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex justify-center w-full px-2">
           <Link
            to="/profile"
            className={`flex flex-col items-center p-3 rounded-lg w-full text-center transition-colors duration-200 ${
              activeTab === "profile"
                ? "text-sky-400 bg-gray-700"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            }`}
            title="Profile"
          >
            <User size={22} />
            <span className="text-[10px] mt-1 md:text-xs">Profile</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Dynamic Title or Logo */}
            <img src={TripToLogo} alt="TripTo" className="w-7 h-7 md:w-8 md:h-8" />
            <span className="text-white text-xl md:text-2xl font-heading">TripTo</span>
          </div>

          <div className="flex items-center space-x-3 md:space-x-4">
            <button className="relative text-gray-400 hover:text-gray-200 p-1">
              <Bell size={20} />
              {user && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  3
                </span>
              )}
            </button>

            {!user ? (
              <>
                <button
                  onClick={onTriggerSignIn}
                  className="px-3 py-1.5 bg-ocean hover:bg-ocean/90 text-white rounded text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={onTriggerSignUp}
                  className="px-3 py-1.5 bg-sunset hover:bg-sunset/90 text-white rounded text-sm font-medium"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={onSignOut}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm font-medium"
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
