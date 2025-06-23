import React, { useState, useEffect, useCallback } from "react";
import MapPicker from "./MapPicker.jsx";
import { X, Loader2 } from "lucide-react";
import api from "../services/api.js";

export default function BlogModal({ open, onClose, onPostCreated, user, onTriggerSignIn }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setSelectedLocationDetails(null);
      setLoading(false);
      setErrorMsg("");
    }
  }, [open]);

  const handleLocationSelected = useCallback((locationData) => {
    setSelectedLocationDetails(locationData);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!user) {
      setErrorMsg("You must be logged in to create a post.");
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
        description: `Location at ${selectedLocationDetails.latitude.toFixed(4)}, ${selectedLocationDetails.longitude.toFixed(4)}`,
      };

      const locationResponse = await api.post("/locations/find-or-create", locationPayload);
      const locationId = locationResponse.data.location_id;
      if (!locationId) throw new Error("Could not obtain a valid location ID.");

      const postPayload = {
        title: title.trim(),
        content: content.trim(),
        location_id: locationId,
      };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl shadow-purple-900/20 p-6 max-w-2xl w-full relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-purple-400 mb-6 flex-shrink-0">New Blog Post</h2>

        {errorMsg && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-sm mb-4 text-center flex-shrink-0">{errorMsg}</p>}

        <div className="flex-grow overflow-y-auto pr-3 custom-scrollbar">
            <form onSubmit={handleCreate} className="space-y-5">
            <div>
                <label htmlFor="postTitle" className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                <input id="postTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="My Awesome Trip to..." required disabled={!user || loading} />
            </div>
            <div>
                <label htmlFor="postContent" className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
                <textarea id="postContent" value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                rows={5} placeholder="Share your story..." required disabled={!user || loading} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Pick Location</label>
                <div className="h-60 md:h-72 rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800">
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

        {/* This footer section with the button has been added back */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !user || !selectedLocationDetails}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="animate-spin" size={18}/> Posting...</> : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}