// frontend/src/pages/CommunityPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Search, ExternalLink } from "lucide-react"; // Removed Bookmark, MessageCircle as they weren't used here
import CreateCommunityModal from "../components/CreateCommunityModal.jsx";
import api from "../services/api.js";

export default function CommunityPage({ user, onTriggerSignIn }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchCommunities() {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/communities");
        setCommunities(response.data.communities || []);
      } catch (err) {
        console.error("Fetch Communities Error:", err);
        setError(err.response?.data?.error || "Failed to load communities.");
        setCommunities([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCommunities();
  }, []);

  const handleCommunityCreated = (newCommunity) => {
    setCommunities((prevCommunities) => [newCommunity, ...prevCommunities]);
    setIsModalOpen(false);
  };

  const filteredCommunities = communities.filter(community =>
    (community.community_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (community.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-2">
        {/* Styled Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-sky-500 dark:text-sky-400"> 
          Explore Communities
        </h1>
        {user && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-ocean hover:bg-ocean/90 text-white px-4 py-2.5 rounded-md font-medium transition-colors w-full sm:w-auto shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Create Community</span>
          </button>
        )}
        {!user && (
             <div className="text-center sm:text-right">
                <p className="text-sm text-gray-400">
                    Want to start a new community?
                    <button onClick={onTriggerSignIn} className="ml-1 text-sky-400 hover:text-sky-300 underline font-semibold">
                        Sign in
                    </button>
                </p>
            </div>
        )}
      </div>

      <div className="relative mt-4 mb-6">
        <input
          type="text"
          placeholder="Search communities by name or description..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-gray-700 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
      </div>

      {isLoading && <p className="text-gray-400 text-center py-5">Loading communities...</p>}
      {error && <p className="text-red-500 bg-red-100 border border-red-500 p-3 rounded-md text-center">{error}</p>}
      
      {!isLoading && !error && filteredCommunities.length === 0 && (
        <p className="text-gray-400 text-center py-10 bg-gray-800/50 rounded-lg">
          {communities.length > 0 ? "No communities match your search." : "No communities found. Why not create one?"}
        </p>
      )}

      {!isLoading && !error && filteredCommunities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredCommunities.map((community) => (
            <Link
              to={`/communities/${community.community_id}`}
              key={community.community_id}
              className="bg-gray-800 rounded-lg shadow-lg p-5 hover:shadow-sky-500/20 hover:border-sky-500 border-2 border-transparent transition-all duration-300 flex flex-col group min-h-[200px]" // Added min-height
            >
              <h3 className="text-xl font-semibold text-sky-400 group-hover:text-sky-300 mb-2 truncate transition-colors" title={community.community_name}>
                {community.community_name}
              </h3>
              <p className="text-gray-300 text-sm mb-3 line-clamp-3 flex-grow">
                {community.description}
              </p>
              <div className="text-xs text-gray-500 mt-auto pt-3 border-t border-gray-700/50">
                <p className="truncate">Location: {community.location?.location_name || "N/A"}{community.location?.country ? `, ${community.location.country}` : ""}</p>
                <p>Created: {new Date(community.created_at).toLocaleDateString()}</p>
                 <div className="flex items-center mt-2 text-sky-500 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                    View Community <ExternalLink size={14} className="ml-1.5"/>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {isModalOpen && (
        <CreateCommunityModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
          onTriggerSignIn={onTriggerSignIn}
          onCommunityCreated={handleCommunityCreated}
        />
      )}
    </div>
  );
}
