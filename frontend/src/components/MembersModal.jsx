// frontend/src/components/MembersModal.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { X, User, Crown } from 'lucide-react';

const MemberListItem = ({ member }) => {
    const username = member.user_profile?.username || 'User';
    const avatarUrl = member.user_profile?.profile_picture_url || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(username.split(' ').map(n=>n[0]).join('').substring(0,2))}&background=374151&color=E5E7EB&size=48&font-size=0.45&bold=true&format=svg`;

    return (
        <Link 
            to={`/profile/${member.user_id}`}
            className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
            <img src={avatarUrl} alt={username} className="w-10 h-10 rounded-full mr-3 border-2 border-gray-600"/>
            <div className="flex-1">
                <p className="font-semibold text-gray-100">{username}</p>
                <p className="text-xs text-gray-400">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
            </div>
            {member.role === 'admin' && (
                <div className="flex items-center text-xs text-yellow-400" title="Community Admin">
                    <Crown size={14} className="mr-1"/>
                    <span>Admin</span>
                </div>
            )}
        </Link>
    );
};


export default function MembersModal({ open, onClose, members = [] }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[110] p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative flex flex-col shadow-2xl max-h-[80vh] border border-gray-700">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
            <h2 className="text-xl font-bold text-white">Community Members ({members.length})</h2>
            <button
            onClick={onClose}
            className="text-gray-500 hover:text-sky-400 transition-colors p-1 rounded-full hover:bg-gray-700"
            aria-label="Close modal"
            >
            <X size={24} />
            </button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
            {members.length > 0 ? (
                <ul className="space-y-2">
                    {members.map(member => (
                        <li key={member.user_id}>
                            <MemberListItem member={member} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-400 py-8">No members found.</p>
            )}
        </div>
      </div>
    </div>
  );
}
