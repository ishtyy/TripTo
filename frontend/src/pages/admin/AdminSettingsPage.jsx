import React, { useState, useEffect } from 'react';
import { Shield, Settings, Database, Bell, Globe, Save, Users, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [systemSettings, setSystemSettings] = useState({
        site_name: 'TripTo 2.0',
        site_description: 'Your ultimate travel companion',
        max_upload_size: 10, // MB
        registration_enabled: true,
        email_verification_required: true,
        community_creation_enabled: true,
        auto_approve_communities: false,
        maintenance_mode: false,
        rate_limits: {
            api_calls_per_minute: 100,
            uploads_per_hour: 50,
            posts_per_day: 20
        },
        email_settings: {
            smtp_host: '',
            smtp_port: 587,
            smtp_username: '',
            smtp_password: '',
            from_email: '',
            from_name: 'TripTo 2.0'
        },
        security_settings: {
            password_min_length: 8,
            require_special_chars: true,
            session_timeout: 24, // hours
            max_login_attempts: 5,
            lockout_duration: 30 // minutes
        }
    });
    const [stats, setStats] = useState({
        total_users: 0,
        total_posts: 0,
        total_communities: 0,
        active_users_24h: 0,
        storage_used: 0,
        api_calls_today: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchStats();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            setSystemSettings(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/system-stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setSystemSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (section, field, value) => {
        setSystemSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await api.put('/admin/settings', systemSettings);
            toast.success('System settings updated successfully!');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleClearCache = async () => {
        try {
            await api.post('/admin/clear-cache');
            toast.success('Cache cleared successfully!');
        } catch (error) {
            console.error('Error clearing cache:', error);
            toast.error('Failed to clear cache');
        }
    };

    const handleBackupDatabase = async () => {
        try {
            const response = await api.post('/admin/backup-database');
            toast.success('Database backup initiated!');
        } catch (error) {
            console.error('Error backing up database:', error);
            toast.error('Failed to initiate backup');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-800 rounded-xl p-6">
                                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                                    <div className="h-8 bg-gray-700 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">System Administration</h1>
                    <p className="text-gray-400">Manage platform settings and configuration</p>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-blue-600/20 rounded-xl p-4 border border-blue-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={20} className="text-blue-400" />
                            <span className="text-sm text-blue-300">Total Users</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.total_users.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-600/20 rounded-xl p-4 border border-purple-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 size={20} className="text-purple-400" />
                            <span className="text-sm text-purple-300">Posts</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.total_posts.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-600/20 rounded-xl p-4 border border-green-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe size={20} className="text-green-400" />
                            <span className="text-sm text-green-300">Communities</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.total_communities.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-600/20 rounded-xl p-4 border border-yellow-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={20} className="text-yellow-400" />
                            <span className="text-sm text-yellow-300">Active 24h</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.active_users_24h.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-600/20 rounded-xl p-4 border border-red-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Database size={20} className="text-red-400" />
                            <span className="text-sm text-red-300">Storage</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{(stats.storage_used / 1024).toFixed(1)}GB</p>
                    </div>
                    <div className="bg-cyan-600/20 rounded-xl p-4 border border-cyan-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 size={20} className="text-cyan-400" />
                            <span className="text-sm text-cyan-300">API Calls</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.api_calls_today.toLocaleString()}</p>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="text-purple-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">General Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
                            <input
                                type="text"
                                value={systemSettings.site_name}
                                onChange={(e) => handleInputChange('site_name', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Max Upload Size (MB)</label>
                            <input
                                type="number"
                                value={systemSettings.max_upload_size}
                                onChange={(e) => handleInputChange('max_upload_size', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
                            <textarea
                                value={systemSettings.site_description}
                                onChange={(e) => handleInputChange('site_description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {[
                            { key: 'registration_enabled', label: 'Allow Registration' },
                            { key: 'email_verification_required', label: 'Email Verification Required' },
                            { key: 'community_creation_enabled', label: 'Community Creation Enabled' },
                            { key: 'auto_approve_communities', label: 'Auto-approve Communities' },
                            { key: 'maintenance_mode', label: 'Maintenance Mode', warning: true }
                        ].map(({ key, label, warning }) => (
                            <div key={key} className={`flex items-center justify-between p-4 rounded-lg border ${warning ? 'bg-red-900/20 border-red-600/50' : 'bg-gray-700/30 border-gray-600'}`}>
                                <span className={`text-sm font-medium ${warning ? 'text-red-300' : 'text-gray-300'}`}>{label}</span>
                                <input
                                    type="checkbox"
                                    checked={systemSettings[key]}
                                    onChange={(e) => handleInputChange(key, e.target.checked)}
                                    className={`w-5 h-5 rounded focus:ring-2 ${warning ? 'text-red-500 bg-red-900 border-red-600 focus:ring-red-500' : 'text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500'}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-red-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Min Password Length</label>
                            <input
                                type="number"
                                value={systemSettings.security_settings?.password_min_length || 8}
                                onChange={(e) => handleNestedChange('security_settings', 'password_min_length', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (hours)</label>
                            <input
                                type="number"
                                value={systemSettings.security_settings?.session_timeout || 24}
                                onChange={(e) => handleNestedChange('security_settings', 'session_timeout', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
                            <input
                                type="number"
                                value={systemSettings.security_settings?.max_login_attempts || 5}
                                onChange={(e) => handleNestedChange('security_settings', 'max_login_attempts', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Rate Limits */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="text-yellow-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Rate Limits</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">API Calls/Minute</label>
                            <input
                                type="number"
                                value={systemSettings.rate_limits?.api_calls_per_minute || 100}
                                onChange={(e) => handleNestedChange('rate_limits', 'api_calls_per_minute', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Uploads/Hour</label>
                            <input
                                type="number"
                                value={systemSettings.rate_limits?.uploads_per_hour || 50}
                                onChange={(e) => handleNestedChange('rate_limits', 'uploads_per_hour', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Posts/Day</label>
                            <input
                                type="number"
                                value={systemSettings.rate_limits?.posts_per_day || 20}
                                onChange={(e) => handleNestedChange('rate_limits', 'posts_per_day', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>
                    </div>
                </div>

                {/* System Actions */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="text-blue-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">System Maintenance</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={handleClearCache}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg hover:bg-blue-600/30 transition-colors"
                        >
                            <Database size={20} />
                            Clear Cache
                        </button>
                        <button
                            onClick={handleBackupDatabase}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors"
                        >
                            <Database size={20} />
                            Backup Database
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
