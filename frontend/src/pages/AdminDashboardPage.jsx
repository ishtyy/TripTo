// src/pages/AdminDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, FileText, MessageSquare, Briefcase, Loader2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ title, value, subValue, icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-4 p-6 rounded-xl bg-gray-800/60 border border-gray-700/50 transition-all cursor-pointer hover:border-yellow-500/50 hover:bg-gray-800 w-full"
    >
        <div className={`p-3 rounded-lg flex items-center justify-center ${
            color === 'blue' ? 'bg-blue-900/30 text-blue-400' :
            color === 'green' ? 'bg-green-900/30 text-green-400' :
            color === 'purple' ? 'bg-purple-900/30 text-purple-400' :
            color === 'yellow' ? 'bg-yellow-900/30 text-yellow-400' : ''
        }`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-3xl font-bold text-white">
                {typeof value === 'object' && value !== null && value.count !== undefined
                    ? value.count
                    : value
                }
            </p>
            {subValue && (
                <p className="text-sm text-yellow-500">
                    {typeof subValue === 'object' && subValue !== null && subValue.count !== undefined
                        ? `(${subValue.count} Pending)`
                        : `(${subValue} Pending)`}
                </p>
            )}
        </div>
    </button>
);

const StatsChart = ({ data }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#9ca3af' } },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e1',
                borderColor: '#4b5563',
                borderWidth: 1,
            }
        },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' }, beginAtZero: true }
        }
    };
    return (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 h-96">
            <Line options={options} data={data} />
        </div>
    );
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [timeSpan, setTimeSpan] = useState(30);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, chartRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get(`/admin/stats/over-time?days=${timeSpan}`)
            ]);

            setStats(statsRes.data);

            const labels = [...Array(timeSpan).keys()].map(i => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }).reverse();

            const usersData = Array(timeSpan).fill(0);
            const postsData = Array(timeSpan).fill(0);

            chartRes.data.users.forEach(day => {
                const dateLabel = new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const index = labels.indexOf(dateLabel);
                if (index > -1) usersData[index] = day.count;
            });
            chartRes.data.posts.forEach(day => {
                const dateLabel = new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const index = labels.indexOf(dateLabel);
                if (index > -1) postsData[index] = day.count;
            });

            setChartData({
                labels,
                datasets: [
                    { label: 'New Users', data: usersData, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.2)', tension: 0.2, fill: true },
                    { label: 'New Posts', data: postsData, borderColor: 'rgb(234, 179, 8)', backgroundColor: 'rgba(234, 179, 8, 0.2)', tension: 0.2, fill: true }
                ]
            });

        } catch (error) {
            console.error("Failed to fetch admin stats", error);
            toast.error("Could not load dashboard data.");
            setStats(null);
            setChartData(null);
        } finally {
            setLoading(false);
        }
    }, [timeSpan]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    if (loading) {
        return (
            <div className="p-6 h-full min-h-[calc(100vh-100px)] flex items-center justify-center bg-gray-900">
                <Loader2 className="animate-spin text-yellow-400" size={48}/>
                <p className="ml-4 text-white text-lg">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="p-8 animate-fadeIn">
            {/* Removed the redundant h1 tag */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={stats?.users ?? 'N/A'}
                    icon={<Users size={24} />}
                    color="blue"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Blog Posts"
                    value={stats?.posts ?? 'N/A'}
                    icon={<FileText size={24} />}
                    color="green"
                    onClick={() => navigate('/admin/posts')}
                />
                <StatCard
                    title="Communities"
                    value={stats?.communities ?? 'N/A'}
                    icon={<MessageSquare size={24} />}
                    color="purple"
                    onClick={() => navigate('/admin/communities')}
                />
                <StatCard
                    title="Total Bookings"
                    value={stats?.bookings ?? 'N/A'}
                    subValue={stats?.pendingBookings ?? 0}
                    icon={<Briefcase size={24} />}
                    color="yellow"
                    onClick={() => navigate('/admin/bookings')}
                />
            </div>

            {chartData && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-200">Activity Over Time</h2>
                        <div className="flex items-center bg-gray-800/50 p-1 rounded-lg">
                            {[7, 30, 90].map(days => (
                                <button
                                    key={days}
                                    onClick={() => setTimeSpan(days)}
                                    className={`px-3 py-1 text-sm font-medium text-gray-300 rounded-md transition-all hover:bg-gray-700 ${timeSpan === days ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40' : ''}`}
                                >
                                    {days}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <StatsChart data={chartData} />
                </div>
            )}
        </div>
    );
}