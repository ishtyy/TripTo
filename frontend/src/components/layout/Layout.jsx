import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout(props) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-black text-gray-200 font-sans">
      <Sidebar {...props} />
      <div className="flex-1 flex flex-col bg-dots">
        <Header {...props} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
