import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../services/api";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const delay = setTimeout(() => {
        api.get(`/users/search?q=${searchTerm}`)
          .then(res => setSearchResults(res.data.users || []))
          .catch(err => console.error("User search failed:", err));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

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
    <div className="relative w-full max-w-lg mx-auto" ref={searchRef}>
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input type="text" placeholder="Search for travelers..." className="w-full bg-gray-800/80 border-2 border-transparent focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-2 rounded-full text-white transition-colors"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} />
      </div>
      {isSearchFocused && searchTerm && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 overflow-hidden animate-fade-in">
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map(u => (
                <li key={u.user_id} onClick={() => handleResultClick(u.user_id)} className="flex items-center gap-3 p-3 hover:bg-cyan-600/20 transition-colors cursor-pointer">
                  <img src={u.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=22d3ee&color=000&size=40`} alt={u.username} className="w-8 h-8 rounded-full bg-gray-700"/>
                  <span className="font-semibold">{u.username}</span>
                </li>
              ))}
            </ul>
          ) : <p className="p-4 text-sm text-gray-400 text-center">No users found for "{searchTerm}".</p>}
        </div>
      )}
    </div>
  );
}
