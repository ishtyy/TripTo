import React, { useState, useEffect } from 'react';
import { User, Camera, Shield, Bell, Palette, Globe, Save, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function UserSettingsPage({ user, onUserUpdate }) {
    const [settings, setSettings] = useState({
        username: '',
        email: '',
        profile_picture_url: '',
        bio: '',
        location: '',
        privacy_settings: {
            profile_visibility: 'public',
            email_visibility: 'private',
            activity_visibility: 'friends'
        },
        notification_settings: {
            email_notifications: true,
            push_notifications: true,
            community_updates: true,
            booking_updates: true
        },
        theme_preferences: {
            theme: 'dark',
            language: 'en'
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setSettings(prevSettings => ({
                ...prevSettings,
                username: user.username || '',
                email: user.email || '',
                profile_picture_url: user.profile_picture_url || '',
                bio: user.bio || '',
                location: user.location || '',
                ...user.settings
            }));
        }
        setLoading(false);
    }, [user]);

    const handleInputChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (section, field, value) => {
        setSettings(prev => ({
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
            const response = await api.put('/users/settings', settings);
            toast.success('Settings updated successfully!');
            if (onUserUpdate) {
                onUserUpdate(response.data.user);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordChange(false);
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
                        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                            <div className="h-10 bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                    <p className="text-gray-400">Manage your account preferences and privacy settings</p>
                </div>

                {/* Profile Settings */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="text-purple-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={settings.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                            <textarea
                                value={settings.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                            <input
                                type="text"
                                value={settings.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="City, Country"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture URL</label>
                            <input
                                type="url"
                                value={settings.profile_picture_url}
                                onChange={(e) => handleInputChange('profile_picture_url', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-blue-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Privacy Settings</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
                            <select
                                value={settings.privacy_settings?.profile_visibility || 'public'}
                                onChange={(e) => handleNestedChange('privacy_settings', 'profile_visibility', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="public">Public</option>
                                <option value="friends">Friends Only</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Visibility</label>
                            <select
                                value={settings.privacy_settings?.email_visibility || 'private'}
                                onChange={(e) => handleNestedChange('privacy_settings', 'email_visibility', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="public">Public</option>
                                <option value="friends">Friends Only</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="text-yellow-400" size={24} />
                        <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {Object.entries(settings.notification_settings || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <label className="text-gray-300 capitalize">
                                    {key.replace('_', ' ')}
                                </label>
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => handleNestedChange('notification_settings', key, e.target.checked)}
                                    className="w-5 h-5 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Password Change */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Shield className="text-red-400" size={24} />
                            <h2 className="text-xl font-semibold text-white">Security</h2>
                        </div>
                        <button
                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors"
                        >
                            {showPasswordChange ? <EyeOff size={16} /> : <Eye size={16} />}
                            Change Password
                        </button>
                    </div>
                    
                    {showPasswordChange && (
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                            />
                            <button
                                onClick={handlePasswordChange}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Update Password
                            </button>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
