import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Users, Circle } from 'lucide-react';
import api from '../../services/api';

export default function ActiveUsers({ className = "" }) {
    const [activeUsers, setActiveUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalActive, setTotalActive] = useState(0);

    useEffect(() => {
        fetchActiveUsers();
        // Refresh every 30 seconds
        const interval = setInterval(fetchActiveUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveUsers = async () => {
        try {
            const response = await api.get('/stats/active-users');
            setActiveUsers(response.data.users || []);
            setTotalActive(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching active users:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-4 ${className}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Activity size={18} className="text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Active Users</h3>
                </div>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                            <div className="flex-1 h-4 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Active Users</h3>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Users size={14} />
                    <span>{totalActive} online</span>
                </div>
            </div>
            
            {activeUsers.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activeUsers.slice(0, 10).map((user) => (
                        <Link
                            key={user.user_id}
                            to={`/profile/${user.user_id}`}
                            className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
                        >
                            <div className="relative">
                                <img
                                    src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full bg-gray-700"
                                />
                                <Circle
                                    size={12}
                                    className="absolute -bottom-1 -right-1 text-green-400 fill-current"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-purple-300 truncate">
                                    {user.username}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {user.last_active_at ? 
                                        `Active ${getTimeAgo(user.last_active_at)}` : 
                                        'Online now'
                                    }
                                </p>
                            </div>
                            {user.role === 'admin' && (
                                <div className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full border border-purple-700/50">
                                    Admin
                                </div>
                            )}
                        </Link>
                    ))}
                    {totalActive > 10 && (
                        <div className="text-center py-2 text-sm text-gray-400">
                            +{totalActive - 10} more users online
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-6 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active users right now</p>
                </div>
            )}
        </div>
    );
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
}
