// frontend/src/pages/CommunityPage.jsx

import React, { useState } from "react";
import { Bookmark, Users, MessageCircle, Plus } from "lucide-react";
import CreateCommunityModal from "../components/CreateCommunityModal";

export default function CommunityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Example pinned and recent posts (static placeholders)
  return (
    <div className="px-4 space-y-6">
      {/* 1) “Create Community” button at top */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-sky-400">Communities</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-ocean hover:bg-ocean/90 text-white px-4 py-2 rounded"
        >
          <Plus />
          <span>Create Community</span>
        </button>
      </div>

      {/* 2) Three‐column layout: Pinned, Recent Posts, FAQ/Discussions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Pinned */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading text-sky-400">Pinned</h3>
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer flex items-center space-x-2"
            >
              <Bookmark className="text-sunset" />
              <span className="text-gray-100">Pinned Post #{idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Center Column (span 2): Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            <span>Community Banner</span>
          </div>

          {/* Recent Posts */}
          <div className="space-y-4">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
              >
                <h4 className="text-lg font-semibold text-gray-100">Post #{idx + 1}</h4>
                <p className="text-gray-400 text-sm">
                  A snippet or preview of the post goes here...
                </p>
                <div className="mt-2 flex items-center space-x-4 text-gray-400 text-sm">
                  <Users size={16} /> <span>by User{idx + 1}</span>
                  <MessageCircle size={16} /> <span>{Math.floor(Math.random() * 10)} comments</span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating “Make a Post” button */}
          <div className="fixed bottom-8 right-8">
            <button className="flex items-center space-x-2 bg-ocean hover:bg-ocean/90 text-white px-4 py-2 rounded-full shadow-lg">
              <MessageCircle /> <span>Make a Post</span>
            </button>
          </div>
        </div>

        {/* Right Column: FAQ/Discussions */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading text-sky-400">FAQ / Discussions</h3>
          <div className="bg-gray-800 rounded-lg p-4 h-full text-gray-400">
            <p>Placeholder for FAQs or community discussion threads.</p>
          </div>
        </div>
      </div>

      {/* 3) “Create Community” Modal */}
      <CreateCommunityModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
