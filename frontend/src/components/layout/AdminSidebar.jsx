import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Flag, Package, LogOut } from 'lucide-react';
import TextLogo from './TextLogo';

const AdminSidebar = ({ onSignOut }) => {
    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/reports', label: 'Reports', icon: Flag },
        { path: '/admin/packages', label: 'Packages', icon: Package },
    ];

    return (
        <aside className="w-64 bg-gray-900/80 border-r border-gray-800 flex flex-col p-4">
            <div className="p-4 mb-6">
                <TextLogo />
                <span className="text-xs text-yellow-400 ml-1">Admin Studio</span>
            </div>
            <nav className="flex flex-col space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end // Use 'end' for the dashboard link to avoid it being always active
                        className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                isActive ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto">
                <button
                    onClick={onSignOut}
                    className="flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-gray-400 hover:bg-red-900/50 hover:text-red-400"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;