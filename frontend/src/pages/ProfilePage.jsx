// frontend/src/pages/ProfilePage.jsx

import React from "react";
import { Inbox, Heart, Users } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-8 px-4">
      {/* 1) Move Inbox to top-right of profile */}
      <div className="flex justify-end">
        <button className="flex items-center space-x-2 bg-gray-800 rounded-lg px-4 py-2 hover:bg-gray-700 transition">
          <Inbox className="text-sky-400" />
          <span className="text-gray-100">Inbox</span>
        </button>
      </div>

      {/* 2) User Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Avatar & Basic Info */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-gray-500">Avatar</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-heading text-sky-400">Username</h2>
            <p className="text-gray-400">Travel Enthusiast</p>
          </div>
        </div>

        {/* Middle: Bio & Experience */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Bio:</h3>
            <p className="text-gray-300">
              Avid traveler sharing experiences and tips from around the globe.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Experience:</h3>
            <p className="text-gray-300">5 years of travel blogging</p>
          </div>
        </div>

        {/* Right: Wishlist & Settings */}
        <div className="space-y-4">
          <button className="w-full bg-gray-800 rounded-lg flex items-center px-4 py-2 hover:bg-gray-700 transition">
            <Heart className="mr-2 text-sunset" />
            <span className="text-gray-100">Wishlist</span>
          </button>
          <button className="w-full bg-gray-800 rounded-lg flex items-center px-4 py-2 hover:bg-gray-700 transition">
            <Users className="mr-2 text-sky-300" />
            <span className="text-gray-100">Friends</span>
          </button>
        </div>
      </div>

      {/* 3) User’s Blogs (previously “My Blogs”) */}
      <div>
        <h3 className="text-xl font-heading text-sky-400 mb-4">My Blogs</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
            >
              <h4 className="text-lg font-semibold text-gray-100">
                Blog Post #{idx + 1}
              </h4>
              <p className="text-gray-400 text-sm">
                A short preview of the blog post goes here...
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4) Joined Communities */}
      <div>
        <h3 className="text-xl font-heading text-sky-400 mb-4">
          Joined Communities
        </h3>
        <div className="space-y-3">
          {[...Array(2)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg flex items-center justify-between p-4 hover:bg-gray-700 transition"
            >
              <span className="text-gray-100">Community #{idx + 1}</span>
              <Users className="text-sky-300" />
            </div>
          ))}
          <button className="mt-4 px-4 py-2 bg-ocean hover:bg-ocean/90 text-white rounded">
            Start a Community
          </button>
        </div>
      </div>
    </div>
  );
}
