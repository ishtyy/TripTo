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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 relative flex flex-col shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-heading mb-6 text-gray-100">
          New Blog Post
        </h2>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}
        
        {showSignInMessage && (
           <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            Please <button 
                      onClick={() => { 
                        if (typeof onTriggerSignIn === 'function') {
                          onClose(); 
                          onTriggerSignIn(); 
                        }
                      }} 
                      className="font-bold underline hover:text-yellow-800"
                    >
                      sign in
                    </button> to create a post.
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="flex-1 overflow-y-auto space-y-5 pr-2"
          style={{ maxHeight: "calc(80vh - 180px)" }}
        >
          <div>
            <label htmlFor="postTitle" className="block text-sm font-medium text-gray-200 mb-1">Title</label>
            <input
              id="postTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean border border-gray-600"
              placeholder="My Awesome Trip to..."
              required
              disabled={!user || loading}
            />
          </div>

          <div>
            <label htmlFor="postContent" className="block text-sm font-medium text-gray-200 mb-1">Content</label>
            <textarea
              id="postContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean border border-gray-600"
              rows={5}
              placeholder="Share your story, tips, and experiences..."
              required
              disabled={!user || loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Pick Location</label>
            <div className="h-60 md:h-72 rounded-md overflow-hidden border border-gray-600 bg-gray-700">
              <MapPicker onLocationSelected={handleLocationSelected} /> {/* Use memoized callback */}
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
            disabled={loading || !user || !selectedLocationDetails} // Also disable if no location
            className={`px-5 py-2.5 rounded font-medium transition-colors ${
              (loading || !user || !selectedLocationDetails) ? "bg-gray-500 cursor-not-allowed text-gray-300" : "bg-ocean hover:bg-ocean/90 text-white"
            }`}
          >
            {loading ? "Posting…" : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
