import { useState } from "react";
import { Bed, Plane, Package } from "lucide-react";
import FlightSearch from "../components/booking/FlightSearch";
import HotelSearch from "../components/booking/HotelSearch";
import PackageSearch from "../components/booking/PackageSearch";

export default function BookTripPage() {
  const [selectedTab, setSelectedTab] = useState("flights");

  const tabs = [
    { id: "flights", icon: Plane, label: "Flights" },
    { id: "hotels", icon: Bed, label: "Hotels" },
    { id: "packages", icon: Package, label: "Packages" }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex space-x-2 border-b border-gray-800 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
              className={`py-3 px-5 flex items-center gap-3 transition-all duration-200 border-b-2 text-base font-semibold ${
                selectedTab === tab.id
                  ? "border-purple-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-t-lg"
              }`}>
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div>
          {selectedTab === 'flights' && <FlightSearch />}
          {selectedTab === 'hotels' && <HotelSearch />}
          {selectedTab === 'packages' && <PackageSearch />}
        </div>
      </div>
    </div>
  );
}