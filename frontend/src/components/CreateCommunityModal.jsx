// frontend/src/components/CreateCommunityModal.jsx

import React, { useState } from "react";
import MapPicker from "./MapPicker";
import { X } from "lucide-react";

export default function CreateCommunityModal({ open, onClose }) {
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleCreate(e) {
    e.preventDefault();
    if (!communityName.trim() || !description.trim() || !coords) {
      alert("Please fill out all fields and pick a location.");
      return;
    }
    setLoading(true);

    try {
      // We assume you already have a location in your DB for that lat/lng
      // For simplicity, let’s POST lat/lng as location_id—that will fail if no location row exists.
      // Ideally, you’d look up location_id in a 'location' table (by lat/lng) first.
      // But for now, we’ll just pass coords.latitude as a dummy id, or you can hardcode a location_id.
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          community_name: communityName,
          description,
          location_id: coords.location_id || "some‐existing‐location‐id"
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Create community failed");
      }

      const json = await response.json();
      console.log("Created community:", json.community);
      onClose();
    } catch (err) {
      console.error("Create Community Error:", err);
      alert("Could not create community. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-heading mb-4 text-gray-100">Create Community</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-gray-200 mb-1">Community Name</label>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean"
              placeholder="e.g. Paris Travelers"
              required
            />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean"
              rows={3}
              placeholder="Short description of this community"
              required
            />
          </div>
          <div>
            <label className="block text-gray-200 mb-1">Pick Location</label>
            <MapPicker
              onLocationSelected={({ latitude, longitude }) => {
                setCoords({ latitude, longitude });
              }}
            />
            {coords && (
              <p className="mt-2 text-gray-400">
                Selected: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </p>
            )}
          </div>
          <div className="text-right">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded ${
                loading ? "bg-gray-400" : "bg-ocean hover:bg-ocean/90"
              } text-white`}
            >
              {loading ? "Creating…" : "Create Community"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
