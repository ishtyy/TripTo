import React from "react";
import { Link } from "react-router-dom";
import { Inbox, Bell } from "lucide-react";

export default function UserMenu({ user, onTriggerSignIn, onTriggerSignUp }) {
  return (
    <div className="flex justify-end items-center space-x-4">
      {user ? (
        <>
          <button title="Inbox" className="text-gray-400 hover:text-cyan-300"><Inbox size={22} /></button>
          <button title="Notifications" className="text-gray-400 hover:text-cyan-300"><Bell size={22} /></button>
          <Link to={`/profile/${user.user_id}`} title="View Profile">
            <img src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=22d3ee&color=000&size=36`} alt="User Avatar" className="w-9 h-9 rounded-full border-2 border-cyan-500"/>
          </Link>
        </>
      ) : (
        <>
          <button onClick={onTriggerSignIn} className="font-semibold text-gray-300 hover:text-cyan-400">Sign In</button>
          <button onClick={onTriggerSignUp} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40">Sign Up</button>
        </>
      )}
    </div>
  );
}
