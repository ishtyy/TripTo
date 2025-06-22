// frontend/src/components/BlogModal.jsx
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import MapPicker from "./MapPicker.jsx";
import { X } from "lucide-react";
import api from "../services/api.js";

export default function BlogModal({ open, onClose, onPostCreated, user, onTriggerSignIn }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    console.log("[BlogModal] useEffect triggered. Open:", open, "User:", user);
    if (open) {
      setTitle("");
      setContent("");
      setSelectedLocationDetails(null);
      setLoading(false);
      setErrorMsg("");
      console.log("[BlogModal] Modal opened. User prop:", user);
    }
  }, [open]);

  // Memoize onLocationSelected callback
  const handleLocationSelected = useCallback((locationData) => {
    console.log("[BlogModal] Location selected from MapPicker:", locationData);
    setSelectedLocationDetails(locationData);
  }, []); // Empty dependency array means this function is created once

  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg("");
    console.log("[BlogModal] handleCreate called. User prop:", user);

    if (!user) {
      console.error("[BlogModal] Create attempt failed: User is not authenticated.");
      setErrorMsg("You must be logged in to create a post.");
      if (typeof onTriggerSignIn === 'function') {
        // onClose(); // Optionally close this modal first
        // onTriggerSignIn();
      }
      return;
    }

    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title and content are required.");
      return;
    }
    if (!selectedLocationDetails) {
      setErrorMsg("Please pick a location on the map.");
      return;
    }

    setLoading(true);

    try {
      const locationPayload = {
        latitude: selectedLocationDetails.latitude,
        longitude: selectedLocationDetails.longitude,
        location_name: selectedLocationDetails.name || "Selected Location",
        country: selectedLocationDetails.country || "Unknown Country",
        description: selectedLocationDetails.description || `Location at ${selectedLocationDetails.latitude.toFixed(4)}, ${selectedLocationDetails.longitude.toFixed(4)}`,
      };

      console.log("[BlogModal] Attempting to find/create location with payload:", locationPayload);
      let locationResponse;
      try {
        locationResponse = await api.post("/locations/find-or-create", locationPayload);
      } catch (locError) {
        console.error("[BlogModal] Find or Create Location Error:", locError.response || locError.message);
        setErrorMsg(locError.response?.data?.error || "Failed to process location for the post.");
        setLoading(false);
        return;
      }
      
      const locationId = locationResponse.data.location_id;

      if (!locationId) {
        console.error("[BlogModal] Could not obtain a valid location ID.");
        setErrorMsg("Could not obtain a valid location ID for the post.");
        setLoading(false);
        return;
      }

      const postPayload = {
        title: title.trim(),
        content: content.trim(),
        location_id: locationId,
      };

      console.log("[BlogModal] Attempting to create post with payload:", postPayload);
      const postResponse = await api.post("/posts", postPayload);

      onPostCreated(postResponse.data.post);
      onClose(); 
    } catch (err) {
      console.error("[BlogModal] Create Post Error:", err.response || err.message);
      setErrorMsg(err.response?.data?.error || "Could not create post. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  const showSignInMessage = !user && open;

 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl shadow-purple-900/20 p-6 max-w-2xl w-full relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-purple-400 mb-6">New Blog Post</h2>

        {errorMsg && <p className="text-red-400 bg-red-900/30 p-2 rounded-md text-sm mb-4 text-center">{errorMsg}</p>}

        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar" style={{ maxHeight: "calc(80vh - 180px)" }}>
          <div>
            <label htmlFor="postTitle" className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input id="postTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="My Awesome Trip to..." required disabled={!user || loading} />
          </div>
          <div>
            <label htmlFor="postContent" className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
            <textarea id="postContent" value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              rows={5} placeholder="Share your story..." required disabled={!user || loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Pick Location</label>
            <div className="h-60 md:h-72 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
              <MapPicker onLocationSelected={handleLocationSelected} />
            </div>
            {selectedLocationDetails && (
              <p className="mt-2 text-xs text-purple-300">
                Selected: {selectedLocationDetails.name}, {selectedLocationDetails.country}
              </p>
            )}
          </div>
        </form>

       
      </div>
    </div>
  );
}

