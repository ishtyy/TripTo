import React, { useState, useEffect, useCallback } from "react";
import MapPicker from "../common/MapPicker.jsx";
import { X, Loader2 } from "lucide-react";
import api from "../../services/api.js";

export default function CommunityCreateModal({ open, onClose, user, onTriggerSignIn, onCommunityCreated }) {
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      setCommunityName("");
      setDescription("");
      setSelectedLocationDetails(null);
      setErrorMsg("");
      setLoading(false);
    }
  }, [open]);

  const handleLocationSelected = useCallback((locationData) => {
    setSelectedLocationDetails(locationData);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!user) {
      setErrorMsg("You must be signed in to create a community.");
      return;
    }
    if (!communityName.trim() || !description.trim()) {
      setErrorMsg("Community name and description are required.");
      return;
    }
    if (!selectedLocationDetails) {
      setErrorMsg("Please pick a location on the map for the community.");
      return;
    }

    setLoading(true);
    try {
      const locationPayload = {
        latitude: selectedLocationDetails.latitude,
        longitude: selectedLocationDetails.longitude,
        location_name: selectedLocationDetails.name || "Community Location",
        country: selectedLocationDetails.country || "Unknown",
        description: `Community at ${selectedLocationDetails.latitude.toFixed(4)}, ${selectedLocationDetails.longitude.toFixed(4)}`,
      };
      
      const locationResponse = await api.post("/locations/find-or-create", locationPayload);
      const locationId = locationResponse.data.location?.location_id;

      if (!locationId) {
        throw new Error("Could not obtain a valid location ID.");
      }

      const communityPayload = {
        community_name: communityName.trim(),
        description: description.trim(),
        location_id: locationId,
      };

      const communityResponse = await api.post("/communities", communityPayload);
      
      if (typeof onCommunityCreated === 'function') {
        onCommunityCreated(communityResponse.data.community);
      }
      onClose();
    } catch (err) {
      console.error("[CreateCommunityModal] Create Community Error:", err.response || err.message);
      setErrorMsg(err.response?.data?.error || "Could not create community. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl shadow-purple-900/20 p-6 max-w-2xl w-full relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-purple-400 mb-6">Create New Community</h2>

        {errorMsg && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-sm mb-4 text-center">{errorMsg}</p>}

        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar" style={{ maxHeight: "calc(80vh - 180px)" }}>
          <div>
            <label htmlFor="communityName" className="block text-sm font-medium text-gray-300 mb-1.5">Community Name</label>
            <input id="communityName" type="text" value={communityName} onChange={(e) => setCommunityName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g., Paris Food Lovers" required disabled={!user || loading} />
          </div>
          <div>
            <label htmlFor="communityDescription" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea id="communityDescription" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              rows={4} placeholder="What is this community about?" required disabled={!user || loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Pick Community Location</label>
            <div className="h-60 md:h-72 rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800">
              <MapPicker onLocationSelected={handleLocationSelected} />
            </div>
            {selectedLocationDetails && (
              <p className="mt-2 text-xs text-purple-300">
                Selected: {selectedLocationDetails.name || `Lat: ${selectedLocationDetails.latitude.toFixed(3)}`}, {selectedLocationDetails.country || `Lng: ${selectedLocationDetails.longitude.toFixed(3)}`}
              </p>
            )}
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          <button type="button" onClick={handleCreate} disabled={loading || !user || !selectedLocationDetails}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="animate-spin" size={18}/> Creating...</> : "Create Community"}
          </button>
        </div>
      </div>
    </div>
  );
}