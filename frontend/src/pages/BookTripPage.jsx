// frontend/src/pages/BookTripPage.jsx
import React, { useState } from "react";
import MapPicker from "../components/MapPicker.jsx";
import { Bed, Plane } from "lucide-react";

export default function BookTripPage() {
  const [selectedTab, setSelectedTab] = useState("flights");
  const [pickedCoords, setPickedCoords] = useState(null);

  return (
    <div className="space-y-8 px-4">
      {/* Large map at top */}
      <div className="w-full h-64 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <MapPicker onLocationSelected={setPickedCoords} />
      </div>
      {pickedCoords && (
        <p className="text-gray-200">
          Map selection: {pickedCoords.latitude.toFixed(4)},{" "}
          {pickedCoords.longitude.toFixed(4)}
        </p>
      )}

      {/* Tabs: Flights, Hotels, Packages */}
      <div>
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setSelectedTab("flights")}
            className={`py-2 px-4 ${
              selectedTab === "flights"
                ? "border-b-2 border-ocean text-ocean"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Plane size={20} className="inline mr-1" />
            Flights
          </button>
          <button
            onClick={() => setSelectedTab("hotels")}
            className={`py-2 px-4 ${
              selectedTab === "hotels"
                ? "border-b-2 border-ocean text-ocean"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Bed size={20} className="inline mr-1" />
            Hotels
          </button>
          <button
            onClick={() => setSelectedTab("packages")}
            className={`py-2 px-4 ${
              selectedTab === "packages"
                ? "border-b-2 border-ocean text-ocean"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Plane size={20} className="inline mr-1" />
            Packages
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2/3: Search & List */}
          <div className="md:col-span-2 space-y-4">
            <input
              type="text"
              placeholder={`Search ${selectedTab}...`}
              className="w-full px-4 py-2 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean"
            />
            <button className="px-4 py-2 bg-ocean hover:bg-ocean/90 text-white rounded">
              Search {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
            </button>
            <div className="space-y-3">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <span className="text-gray-100">
                    {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} 
                    Result #{idx + 1}
                  </span>
                  <button className="px-3 py-1 bg-sunset hover:bg-sunset/90 text-white rounded">
                    Book
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1/3: Details Panel */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-xl font-heading text-sky-400">
              {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Details
            </h3>
            <p className="text-gray-300">
              Select an item on the left to view more information here.
            </p>
            <div className="bg-gray-700 h-40 flex items-center justify-center text-gray-400 rounded">
              Details will appear here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
