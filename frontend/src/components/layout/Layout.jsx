// src/components/Layout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout(props) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-black text-gray-200 font-sans">
      <Sidebar {...props} />

      {/* Right column no longer forces overflow-hidden */}
      <div className="flex-1 flex flex-col bg-dots">
        <Header {...props} />

        {/* Main content area scrolls if needed */}
        <main
          className="flex-1 overflow-auto p-4 md:p-6"
          key={location.pathname}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
