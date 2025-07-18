// src/components/Admin/AdminHeader.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function AdminHeader({ title, user }) {
    return (
        <header className="admin-header">
            <h1 className="header-title">{title}</h1>
            <div className="header-actions">
                <button className="action-btn">
                    <Bell size={22} />
                </button>
                {user && (
                    <Link to={`/profile/${user.user_id}`} className="header-user">
                        <img
                            src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=fff&color=111827&size=36`}
                            alt="User Avatar"
                            className="avatar"
                        />
                    </Link>
                )}
            </div>
        </header>
    );
}