import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Globe, MapPin, BookOpen, LogOut } from "lucide-react";
import TextLogo from "./TextLogo";

export default function Sidebar({ user, onSignOut }) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeTab = pathSegments[0] || (location.pathname === '/' ? "home" : "");

  const navItems = [
    { path: "/", icon: Home, label: "Home", tab: "home" },
    { path: "/explore", icon: Globe, label: "Explore", tab: "explore" },
    { path: "/communities", icon: MapPin, label: "Communities", tab: "communities" },
    { path: "/book-trip", icon: BookOpen, label: "Book", tab: "book-trip" },
  ];

  return (
    <aside className="w-28 bg-gray-900/80 border-r border-gray-800 flex flex-col items-center py-6 space-y-2 shadow-lg">
      <Link to="/" title="Homepage" className="mb-6"><TextLogo /></Link>
      <nav className="flex flex-col items-center space-y-2 w-full px-3">
        {navItems.map(item => (
          <Link key={item.tab} to={item.path}
            className={`flex flex-col items-center p-3 rounded-xl w-full text-center transition-all duration-300 relative group ${activeTab === item.tab ? "text-white bg-cyan-600/20" : "text-gray-400 hover:text-white hover:bg-gray-800/60"}`}
            title={item.label}>
            {activeTab === item.tab && (<span className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full shadow-lg shadow-cyan-500/50"></span>)}
            <item.icon size={24} />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {user && (
        <div className="mt-auto flex flex-col items-center space-y-2 w-full px-3">
          <button onClick={onSignOut} className="flex flex-col items-center p-3 rounded-xl w-full text-center text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors duration-200" title="Sign Out">
            <LogOut size={22} />
            <span className="text-xs mt-1 font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
