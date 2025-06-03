// frontend/src/components/CreateCommunityModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import MapPicker from "./MapPicker.jsx";
import { X } from "lucide-react";
import api from "../services/api.js";

// Accept user, onTriggerSignIn, and onCommunityCreated props
export default function CreateCommunityModal({ open, onClose, user, onTriggerSignIn, onCommunityCreated }) {
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  // No need for locationId state here, we get it from find-or-create
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // No need for locationNameInput, use details from MapPicker

  useEffect(() => {
    console.log("[CreateCommunityModal] useEffect triggered. Open:", open, "User:", user);
    if (open) {
      setCommunityName("");
      setDescription("");
      setSelectedLocationDetails(null);
      setErrorMsg("");
      setLoading(false);
      console.log("[CreateCommunityModal] Modal opened. User prop:", user);
    }
  }, [open]);

  // Memoize onLocationSelected callback
  const handleLocationSelected = useCallback((locationData) => {
    console.log("[CreateCommunityModal] Location selected from MapPicker:", locationData);
    setSelectedLocationDetails(locationData);
  }, []);


  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg("");
    console.log("[CreateCommunityModal] handleCreate called. User prop:", user);

    if (!user) {
      console.error("[CreateCommunityModal] Create attempt failed: User is not authenticated.");
      setErrorMsg("You must be signed in to create a community.");
      if (typeof onTriggerSignIn === 'function') {
        // Consider closing this modal before triggering sign-in, or let App.jsx handle modal layering
        // onClose(); 
        // onTriggerSignIn();
      }
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
    // Nominatim provides name and country, so no separate locationNameInput is strictly needed
    // if MapPicker is configured to return comprehensive details.

    setLoading(true);

    try {
      // Step 1: Find or create the location to get a location_id
      const locationPayload = {
        latitude: selectedLocationDetails.latitude,
        longitude: selectedLocationDetails.longitude,
        location_name: selectedLocationDetails.name || "Community Location", // Use name from MapPicker
        country: selectedLocationDetails.country || "Unknown", // Use country from MapPicker
        description: selectedLocationDetails.description || `Community at ${selectedLocationDetails.latitude.toFixed(4)}, ${selectedLocationDetails.longitude.toFixed(4)}`,
      };
      
      console.log("[CreateCommunityModal] Finding/creating location with payload:", locationPayload);
      let locationResponse;
      try {
        locationResponse = await api.post("/locations/find-or-create", locationPayload);
      } catch (locError) {
        console.error("[CreateCommunityModal] Find or Create Location Error:", locError.response || locError.message);
        setErrorMsg(locError.response?.data?.error || "Failed to process location for the community.");
        setLoading(false);
        return;
      }
      
      const locationId = locationResponse.data.location_id;

      if (!locationId) {
        setErrorMsg("Could not obtain a valid location ID for the community.");
        setLoading(false);
        return;
      }

      // Step 2: Create the community with the obtained location_id
      const communityPayload = {
        community_name: communityName.trim(),
        description: description.trim(),
        location_id: locationId,
      };

      console.log("[CreateCommunityModal] Creating community with payload:", communityPayload);
      const communityResponse = await api.post("/communities", communityPayload);
      console.log("[CreateCommunityModal] Community creation successful:", communityResponse.data.community);

      if (typeof onCommunityCreated === 'function') {
        onCommunityCreated(communityResponse.data.community);
      }
      onClose(); // Close modal on success
    } catch (err) {
      console.error("[CreateCommunityModal] Create Community Error:", err.response || err.message);
      setErrorMsg(err.response?.data?.error || "Could not create community. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const showSignInMessage = !user && open; // Determine if sign-in message should be shown

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-xl p-6 relative flex flex-col shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-heading mb-6 text-gray-100">Create New Community</h2>
        
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}

        {showSignInMessage && ( // Show message if user is not logged in
           <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            Please <button 
                      onClick={() => { 
                        if (typeof onTriggerSignIn === 'function') {
                          onClose(); // Close this modal first
                          onTriggerSignIn(); 
                        }
                      }} 
                      className="font-bold underline hover:text-yellow-800"
                    >
                      sign in
                    </button> to create a community.
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="flex-1 overflow-y-auto space-y-5 pr-2"
          style={{ maxHeight: "calc(80vh - 180px)" }}
        >
          <div>
            <label htmlFor="communityName" className="block text-sm font-medium text-gray-200 mb-1">Community Name</label>
            <input
              id="communityName"
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean border border-gray-600"
              placeholder="e.g., Paris Food Lovers"
              required
              disabled={!user || loading}
            />
          </div>
          <div>
            <label htmlFor="communityDescription" className="block text-sm font-medium text-gray-200 mb-1">Description</label>
            <textarea
              id="communityDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean border border-gray-600"
              rows={3}
              placeholder="What is this community about?"
              required
              disabled={!user || loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Pick Community Location</label>
            <div className="h-60 md:h-72 rounded-md overflow-hidden border border-gray-600 bg-gray-700">
              <MapPicker onLocationSelected={handleLocationSelected} />
            </div>
            {selectedLocationDetails && (
              <p className="mt-2 text-xs text-gray-400">
                Selected: {selectedLocationDetails.name || selectedLocationDetails.fullAddress || `Lat: ${selectedLocationDetails.latitude.toFixed(3)}, Lng: ${selectedLocationDetails.longitude.toFixed(3)}`}
                {selectedLocationDetails.country && `, ${selectedLocationDetails.country}`}
              </p>
            )}
          </div>
        </form>
        <div className="mt-6 pt-4 border-t border-gray-700 text-right">
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !user || !selectedLocationDetails} // Also disable if no location selected
            className={`px-5 py-2.5 rounded font-medium transition-colors ${
              (loading || !user || !selectedLocationDetails) ? "bg-gray-500 cursor-not-allowed text-gray-300" : "bg-ocean hover:bg-ocean/90 text-white"
            }`}
          >
            {loading ? "Creating…" : "Create Community"}
          </button>
        </div>
      </div>
    </div>
  );
}
