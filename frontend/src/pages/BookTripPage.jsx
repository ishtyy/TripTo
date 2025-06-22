import React, { useState } from "react";
import MapPicker from "../components/MapPicker.jsx";
import { Bed, Plane, Package } from "lucide-react";

export default function BookTripPage() {
  const [selectedTab, setSelectedTab] = useState("flights");
  const [pickedCoords, setPickedCoords] = useState(null);

  const tabs = [
    { id: "flights", icon: Plane, label: "Flights" },
    { id: "hotels", icon: Bed, label: "Hotels" },
    { id: "packages", icon: Package, label: "Packages" }
  ];

  return (
      <div className="space-y-12 animate-fade-in-up">
    <div className="space-y-8">
      <div className="w-full h-72 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
        <MapPicker onLocationSelected={setPickedCoords} />
      </div>

      <div>
        <div className="flex space-x-2 border-b border-gray-800">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
              className={`py-3 px-5 flex items-center gap-2 transition-all duration-200 border-b-2 text-sm font-semibold ${
                selectedTab === tab.id
                  ? "border-purple-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-t-lg"
              }`}>
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4 p-6 bg-gray-900/70 border border-gray-800 rounded-xl">
            <input type="text" placeholder={`Search ${selectedTab}...`}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"/>
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-purple-600/20">
              Search
            </button>
            <div className="space-y-3 pt-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="bg-gray-800/80 rounded-lg p-4 flex items-center justify-between border border-gray-700/50">
                  <span className="text-gray-200 font-medium">Result Item #{idx + 1}</span>
                  <button className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-semibold transition-colors">Book</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-xl font-bold text-purple-400">Details</h3>
            <p className="text-gray-400">Select an item to see more information.</p>
            <div className="bg-gray-800 h-40 flex items-center justify-center text-gray-500 rounded-lg border border-gray-700">
              Details Panel
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}