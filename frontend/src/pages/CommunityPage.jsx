import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ExternalLink, Compass } from "lucide-react";
import api from "../services/api.js";
import CommunityCreateModal from "../components/community/CommunityCreateModal.jsx";
import CommunityCardSkeleton from "../components/community/CommunityCardSkeleton.jsx";

export default function CommunityPage({ user, onTriggerSignIn }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
        setError("Failed to load communities.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCommunities();
  }, []);

  const handleCommunityCreated = (newCommunity) => {
    setCommunities((prev) => [newCommunity, ...prev]);
    setIsCreateModalOpen(false);
  };

  const filteredCommunities = communities.filter(c =>
    c.community_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-fade-in-up">
      <div className="space-y-8">
        <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* UPDATED TITLE */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">Discover your next adventure</h1>
            {user ? (
              <button onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40">
                <Plus size={20} />
                <span>Create Community</span>
              </button>
            ) : (
              <p className="text-sm text-gray-400">
                <button onClick={onTriggerSignIn} className="ml-1 text-purple-400 hover:text-purple-300 underline font-semibold">Sign in</button> to create a community.
              </p>
            )}
          </div>
          <div className="relative mt-6">
            <input type="text" placeholder="Search communities..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <CommunityCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center py-10 text-red-400 bg-red-900/30 p-4 rounded-md">{error}</p>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
            <Compass size={48} className="text-gray-600 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Communities Found</h3>
            <p className="text-gray-400 mt-2">
              {communities.length > 0 ? "No communities match your search term." : "Be the first to create one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCommunities.map((community) => (
              <Link key={community.community_id} to={`/communities/${community.community_id}`}
                className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 hover:border-purple-600 transition-all duration-300 flex flex-col group hover:shadow-2xl hover:shadow-purple-600/20 min-h-[200px]">
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 mb-2 truncate transition-colors" title={community.community_name}>
                  {community.community_name}
                </h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-3 flex-grow">{community.description}</p>
                <div className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-700/50 space-y-1">
                  <p className="truncate">Location: {community.location?.location_name || "N/A"}</p>
                  <div className="flex items-center mt-2 text-purple-400 group-hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-semibold">
                    View Community <ExternalLink size={14} className="ml-1.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {isCreateModalOpen && <CommunityCreateModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} user={user} onTriggerSignIn={onTriggerSignIn} onCommunityCreated={handleCommunityCreated} />}
      </div>
    </div>
  );
}