// frontend/src/pages/ExplorePage.jsx

import React, { useState } from "react";
import MapPicker from "../components/MapPicker";

export default function ExplorePage() {
  const [selectedCoords, setSelectedCoords] = useState(null);

  return (
    <div className="space-y-8 px-4">
      {/* 1) Make the map take up a lot of screen real estate */}
      <div className="w-full rounded-lg overflow-hidden shadow-lg">
        <MapPicker onLocationSelected={setSelectedCoords} />
      </div>
      {selectedCoords && (
        <p className="text-gray-200">
          Selected: {selectedCoords.latitude.toFixed(4)},{" "}
          {selectedCoords.longitude.toFixed(4)}
        </p>
      )}

      {/* 2) Search & Highlights side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left two‐thirds: search bar */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-heading text-sky-400">Search Destinations</h3>
          <input
            type="text"
            placeholder="Search for cities, countries, packages..."
            className="w-full px-4 py-2 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean"
          />
          <button className="mt-3 px-4 py-2 bg-ocean hover:bg-ocean/90 text-white rounded">
            Search
          </button>
        </div>
        {/* Right one-third: featured packages */}
        <div className="space-y-4">
          <h3 className="text-xl font-heading text-sky-400">Featured Packages</h3>
          {[{ name: "Tropical Paradise", price: "$999" }, { name: "European Escape", price: "$1299" }].map((pkg, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3"
            >
              <span className="text-sunset text-2xl">✨</span>
              <div>
                <p className="text-lg font-semibold text-gray-100">{pkg.name}</p>
                <p className="text-gray-400 text-sm">From {pkg.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3) Community posts gallery */}
      <div>
        <h3 className="text-xl font-heading text-sky-400 mb-4">Community Highlights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg h-48 flex items-center justify-center text-gray-400"
            >
              Post #{idx + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
