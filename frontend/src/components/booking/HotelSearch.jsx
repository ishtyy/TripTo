import React from 'react';
import { Search } from 'lucide-react';

export default function HotelSearch() {
  const handleSearch = () => {
    alert("Hotel search functionality is not yet implemented.");
  };

  return (
    <div className='space-y-6'>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Destination</label>
                <input type="text" placeholder="e.g., Paris, France" className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Check-in</label>
                <input type="date" className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Check-out</label>
                <input type="date" className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>
        </div>
        <button onClick={handleSearch} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2">
            <Search />
            <span>Search Hotels</span>
        </button>
    </div>
  );
}