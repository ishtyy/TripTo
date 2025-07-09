// frontend/src/pages/CreateCommunityPage.jsx

import { useState, useEffect } from "react";
import api from "../services/api.js";
import MapPicker from "../components/common/MapPicker.jsx";

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
      <div className="space-y-12 animate-fade-in-up">
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-900/80 border border-gray-800 shadow-2xl rounded-xl p-8">
        <h2 className="text-3xl font-bold text-purple-400 mb-6">Create a New Community</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="community-name" className="block text-gray-300 font-medium mb-2">Community Name</label>
            <input id="community-name" type="text"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="e.g., Tokyo Street Photography" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Select Location</label>
            <div className="h-80 rounded-lg overflow-hidden border border-gray-700">
                <MapPicker onLocationSelected={({ latitude, longitude }) => setCoords({ latitude, longitude })} />
            </div>
            {coords.latitude && (
              <p className="mt-2 text-sm text-purple-300">Selected: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full px-4 py-3 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="animate-spin" size={18}/> Creating...</> : "Create Community"}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}