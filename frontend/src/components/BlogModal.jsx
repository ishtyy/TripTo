// frontend/src/components/BlogModal.jsx
import React, { useState } from "react";
import MapPicker from "./MapPicker.jsx";
import { X } from "lucide-react";

export default function BlogModal({ open, onClose, onPostCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !coords) {
      alert("Please fill out all fields and pick a location.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tripto_token")}`,
        },
        body: JSON.stringify({
          title,
          content,
          location_id: coords.location_id || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");
      const json = await response.json();
      onPostCreated(json.post);
      // Reset fields
      setTitle("");
      setContent("");
      setCoords(null);
      onClose();
    } catch (err) {
      console.error("Create Post Error:", err);
      alert("Could not create post. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-heading mb-4 text-gray-100">
          New Blog Post
        </h2>

        {/* Make the form scrollable if it grows too tall */}
        <form
          onSubmit={handleCreate}
          className="flex-1 overflow-y-auto space-y-6"
          style={{ maxHeight: "70vh" }}
        >
          <div>
            <label className="block text-gray-200 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean"
              placeholder="Post title"
              required
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean"
              rows={4}
              placeholder="Write your post…"
              required
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-1">Pick Location</label>
            {/* Constrain the MapPicker’s height so it doesn’t overflow */}
            <div className="h-48 rounded-md overflow-hidden border border-gray-700">
              <MapPicker
                onLocationSelected={({ latitude, longitude }) => {
                  setCoords({ latitude, longitude });
                }}
              />
            </div>
            {coords && (
              <p className="mt-2 text-gray-400">
                Selected: {coords.latitude.toFixed(4)},{" "}
                {coords.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </form>

        {/* The footer (Create button) stays pinned at bottom */}
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className={`px-4 py-2 rounded ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-ocean hover:bg-ocean/90"
            } text-white`}
          >
            {loading ? "Posting…" : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
