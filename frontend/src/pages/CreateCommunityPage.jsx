// frontend/src/pages/CreateCommunityPage.jsx

import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import MapPicker from "../components/MapPicker.jsx";

export default function CreateCommunityPage({ user }) {
  const [name, setName] = useState("");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setMessage("You must be signed in to create a community.");
    } else {
      setMessage("");
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || coords.latitude === null) {
      alert("Enter a name and click on the map to select a location.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/communities", {
        name: name.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      alert(`Community "${name}" created!`);
      setName("");
      setCoords({ latitude: null, longitude: null });
    } catch (err) {
      console.error("Create Community Error:", err);
      alert("Failed to create community. Check console.");
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-heading text-sky-400 mb-4">
          Create a New Community
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="community-name"
              className="block text-gray-200 font-medium mb-1"
            >
              Community Name
            </label>
            <input
              id="community-name"
              type="text"
              className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Enter community name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-200 font-medium mb-1">
              Select Location
            </label>
            <MapPicker
              onLocationSelected={({ latitude, longitude }) =>
                setCoords({ latitude, longitude })
              }
            />
            {coords.latitude && (
              <p className="mt-2 text-gray-400">
                Selected: {coords.latitude.toFixed(4)},{" "}
                {coords.longitude.toFixed(4)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 rounded ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-ocean hover:bg-ocean/90"
            } text-white font-medium transition`}
          >
            {loading ? "Creating…" : "Create Community"}
          </button>
        </form>
      </div>
    </div>
  );
}
