import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Globe, MapPin, BookOpen, Home, Inbox, LogOut, Search } from "lucide-react";
import api from "../services/api";
import TextLogo from "./TextLogo";

export default function Layout({ user, onSignOut, onTriggerSignIn, onTriggerSignUp }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeTab = pathSegments[0] || (location.pathname === '/' ? "home" : "");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const delayDebounceFn = setTimeout(() => {
        api.get(`/users/search?q=${searchTerm}`)
          .then(res => setSearchResults(res.data.users || []))
          .catch(err => console.error("User search failed:", err));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const handleResultClick = (userId) => {
    if (!userId) return;
    clearSearch();
    navigate(`/profile/${userId}`);
  };

  useEffect(() => { clearSearch(); }, [location]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        clearSearch();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-black text-gray-200 font-sans">
      <aside className="w-28 bg-gray-900/80 border-r border-gray-800 flex flex-col items-center py-6 space-y-2 shadow-lg">
        <Link to="/" title="Homepage" className="mb-6">
          <TextLogo />
        </Link>
        <nav className="flex flex-col items-center space-y-2 w-full px-3">
          {[
            { path: "/", icon: Home, label: "Home", tab: "home" },
            { path: "/explore", icon: Globe, label: "Explore", tab: "explore" },
            { path: "/communities", icon: MapPin, label: "Communities", tab: "communities" },
            { path: "/book-trip", icon: BookOpen, label: "Book", tab: "book-trip" },
          ].map((item) => (
            <Link key={item.tab} to={item.path} className={`flex flex-col items-center p-3 rounded-xl w-full text-center transition-all duration-300 relative group ${activeTab === item.tab ? "text-white bg-cyan-600/20" : "text-gray-400 hover:text-white hover:bg-gray-800/60"}`} title={item.label}>
              {activeTab === item.tab && (<span className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full shadow-lg shadow-cyan-500/50"></span>)}
              <item.icon size={24} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center space-y-2 w-full px-3">
          {user && (
             <button onClick={onSignOut} className="flex flex-col items-center p-3 rounded-xl w-full text-center text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors duration-200" title="Sign Out">
                <LogOut size={22} />
                <span className="text-xs mt-1 font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-dots">
        <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-2 grid grid-cols-3 items-center sticky top-0 z-50 backdrop-blur-sm">
          <div className="flex justify-start"></div>
          <div className="relative w-full max-w-lg mx-auto" ref={searchRef}>
            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="text" placeholder="Search for travelers..." className="w-full bg-gray-800/80 border-2 border-transparent focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-2 rounded-full text-white transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} />
            </div>
            {isSearchFocused && searchTerm && (
                <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 overflow-hidden animate-fade-in" style={{animationDuration: '0.2s'}}>
                    {searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map(u => (
                                <li key={u.user_id} onClick={() => handleResultClick(u.user_id)} className="flex items-center gap-3 p-3 hover:bg-cyan-600/20 transition-colors cursor-pointer">
                                    <img src={u.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=22d3ee&color=000&size=40`} alt={u.username} className="w-8 h-8 rounded-full bg-gray-700"/>
                                    <span className="font-semibold">{u.username}</span>
                                </li>
                            ))}
                        </ul>
                    ) : ( <p className="p-4 text-sm text-gray-400 text-center">No users found for "{searchTerm}".</p> )}
                </div>
            )}
          </div>
          <div className="flex justify-end items-center space-x-4">
            {user ? (
              <>
                <button title="Inbox" className="text-gray-400 hover:text-cyan-300"><Inbox size={22} /></button>
                <button title="Notifications" className="text-gray-400 hover:text-cyan-300"><Bell size={22} /></button>
                <Link to={`/profile/${user.user_id}`} title="View Profile"><img src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=22d3ee&color=000&size=36`} alt="User Avatar" className="w-9 h-9 rounded-full border-2 border-cyan-500"/></Link>
              </>
            ) : (
              <>
                <button onClick={onTriggerSignIn} className="font-semibold text-gray-300 hover:text-cyan-400 transition-colors">Sign In</button>
                <button onClick={onTriggerSignUp} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40">Sign Up</button>
              </>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}