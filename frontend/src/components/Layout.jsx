// frontend/src/components/Layout.jsx
import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Globe, MapPin, BookOpen, Home, Inbox as InboxIcon, LogOut as LogOutIcon } from "lucide-react";
import TripToLogoSrc from "../assets/tripto-logo.svg"; // Using your specified logo import

export default function Layout({ user, onSignOut, onTriggerSignIn, onTriggerSignUp }) {
  const location = useLocation();
  const navigate = useNavigate(); 
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeTab = pathSegments[0] || (location.pathname === '/' ? "home" : ""); 

  const handleInboxClick = () => {
    if (!user) {
        onTriggerSignIn(); 
        return;
    }
    console.log("Inbox icon clicked!");
    alert("Inbox functionality to be implemented.");
    // navigate("/inbox"); // TODO: Create an /inbox route and page
  };

  // --- DYNAMIC NOTIFICATION COUNTS ---
  // TODO: Replace these with actual state/props derived from your application's data
  const unreadNotificationCount = 0; 
  const unreadInboxCount = 0; 
  // For example, these could come from a context, Redux, or be fetched in App.jsx and passed down.

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-20 md:w-24 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 space-y-1 shadow-lg">
        <div className="flex justify-center mb-6">
          <Link to="/" title="Go to Homepage">
            <img src={TripToLogoSrc} alt="TripTo Logo" className="w-8 h-8 md:w-10 md:h-10 hover:opacity-80 transition-opacity" />
          </Link>
        </div>

        <nav className="flex flex-col items-center space-y-1 w-full px-2">
          {[
            { path: "/", icon: Home, label: "Home", tab: "home" },
            { path: "/explore", icon: Globe, label: "Explore", tab: "explore" },
            { path: "/communities", icon: MapPin, label: "Communities", tab: "communities" },
            { path: "/book-trip", icon: BookOpen, label: "Book", tab: "book-trip" },
          ].map((item) => (
            <Link
              key={item.tab}
              to={item.path}
              className={`flex flex-col items-center p-3 rounded-lg w-full text-center transition-colors duration-200 ${
                activeTab === item.tab
                  ? "text-sky-400 bg-gray-700 shadow-inner"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              }`}
              title={item.label}
            >
              <item.icon size={22} />
              <span className="text-[10px] mt-1 md:text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sign Out button is now at the bottom of the sidebar if user is logged in */}
        <div className="mt-auto flex flex-col items-center space-y-1 w-full px-2">
          {user && (
             <button
                onClick={onSignOut}
                className="flex flex-col items-center p-3 rounded-lg w-full text-center text-gray-400 hover:text-red-400 hover:bg-gray-700/50 transition-colors duration-200"
                title="Sign Out"
            >
                <LogOutIcon size={22} />
                <span className="text-[10px] mt-1 md:text-xs font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <span className="text-white text-xl md:text-2xl font-heading">
              {activeTab ? (activeTab.charAt(0).toUpperCase() + activeTab.slice(1)) : "TripTo"}
            </span>
          </div>

          {/* Icons container */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Inbox Icon */}
            <button 
                onClick={handleInboxClick}
                className="relative text-gray-400 hover:text-sky-300 p-2 rounded-full hover:bg-gray-700 transition-colors"
                title="Inbox"
                aria-label="Inbox"
            >
              <InboxIcon size={20} />
              {user && unreadInboxCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-blue-600 rounded-full ring-1 ring-gray-800">
                  {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                </span>
              )}
            </button>
            
            {/* Notification Bell Icon */}
            <button 
                className="relative text-gray-400 hover:text-sky-300 p-2 rounded-full hover:bg-gray-700 transition-colors"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => alert("Notifications (TODO)")}
            >
              <Bell size={20} />
              {user && unreadNotificationCount > 0 && ( 
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full ring-1 ring-gray-800">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Auth Buttons or User Avatar */}
            {!user ? (
              <>
                <button
                  onClick={onTriggerSignIn}
                  className="px-3 py-1.5 bg-ocean hover:bg-ocean/90 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onTriggerSignUp}
                  className="px-3 py-1.5 bg-sunset hover:bg-sunset/90 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <Link to="/profile" className="flex items-center space-x-2 p-1 pr-2 rounded-full hover:bg-gray-700 transition-colors" title="View Profile">
                  <img 
                    src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D8ABC&color=fff&size=32&font-size=0.5&bold=true`} 
                    alt="User Avatar" 
                    className="w-7 h-7 rounded-full border-2 border-gray-600 bg-gray-700"
                  />
                  <span className="text-sm text-gray-200 font-medium hidden md:inline">{user.username}</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
