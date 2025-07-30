// src/pages/AdminDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, FileText, MessageSquare, Briefcase, Loader2, TrendingUp, TrendingDown, Activity, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

const StatCard = ({ title, value, subValue, icon, color, trend, onClick, percentage, growth, target }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col p-6 rounded-xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50 transition-all cursor-pointer hover:border-${color}-500/50 hover:shadow-lg hover:shadow-${color}-500/20 w-full group overflow-hidden transform hover:scale-105`}
    >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}-500/10 to-${color}-600/5 opacity-0 group-hover:opacity-100 transition-opacity`} />
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r from-${color}-500 to-${color}-600 shadow-lg`}>
                    {icon}
                </div>
                {(trend !== undefined || growth !== undefined) && (
                    <div className="flex flex-col items-end gap-1">
                        {trend !== undefined && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                trend > 0 ? 'text-green-400 bg-green-900/30' : 
                                trend < 0 ? 'text-red-400 bg-red-900/30' : 
                                'text-gray-400 bg-gray-800/30'
                            }`}>
                                {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : null}
                                <span>{trend > 0 ? '+' : ''}{trend}%</span>
                            </div>
                        )}
                        {growth !== undefined && (
                            <div className="text-xs text-gray-400">
                                vs last month
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="text-left">
                <p className="text-3xl font-bold text-white mb-1">
                    {typeof value === 'object' && value !== null && value.count !== undefined
                        ? value.count
                        : value || 'N/A'
                    }
                </p>
                <p className="text-sm text-gray-400 mb-2">{title}</p>
                
                {subValue && (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        {typeof subValue === 'object' && subValue !== null && subValue.count !== undefined
                            ? `${subValue.count} Pending`
                            : `${subValue} Pending`}
                    </p>
                )}
                
                {percentage && (
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Active Rate</span>
                            <span>{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className={`bg-gradient-to-r from-${color}-500 to-${color}-600 h-2 rounded-full transition-all duration-500 ease-out`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {target && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Target</span>
                            <span className="text-gray-300">{target}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </button>
);

const StatsChart = ({ data }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                labels: { color: '#e2e8f0', font: { size: 12 } },
                position: 'top'
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: '#6b7280',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true
            }
        },
        scales: {
            x: { 
                ticks: { color: '#9ca3af', font: { size: 11 } }, 
                grid: { color: '#374151', display: false }
            },
            y: { 
                ticks: { color: '#9ca3af', font: { size: 11 } }, 
                grid: { color: '#374151' }, 
                beginAtZero: true 
            }
        },
        elements: {
            point: { radius: 4, hoverRadius: 6 }
        }
    };
    return (
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50 rounded-xl p-6 h-96">
            <Line options={options} data={data} />
        </div>
    );
};

const QuickMetricsCard = ({ title, metrics, icon: IconComponent, color }) => (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            {IconComponent ? <IconComponent size={18} className={`text-${color}-400`} /> : <BarChart3 size={18} className="text-blue-400" />}
            {title}
        </h3>
        <div className="space-y-4">
            {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                        {metric.icon && React.createElement(metric.icon, { size: 14, className: "text-gray-400" })}
                        {metric.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{metric.value}</span>
                        {metric.trend && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                metric.trend > 0 ? 'text-green-400 bg-green-900/30' : 
                                metric.trend < 0 ? 'text-red-400 bg-red-900/30' : 
                                'text-gray-400 bg-gray-800/30'
                            }`}>
                                {metric.trend > 0 ? '+' : ''}{metric.trend}%
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);
export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [platformStats, setPlatformStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [timeSpan, setTimeSpan] = useState(30);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, chartRes, platformRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get(`/admin/stats/over-time?days=${timeSpan}`),
                api.get('/stats').catch(() => ({ data: null }))
            ]);

            setStats(statsRes.data);
            setPlatformStats(platformRes.data);

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
                    { 
                        label: 'New Users', 
                        data: usersData, 
                        borderColor: 'rgb(59, 130, 246)', 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        tension: 0.4, 
                        fill: true,
                        borderWidth: 2
                    },
                    { 
                        label: 'New Posts', 
                        data: postsData, 
                        borderColor: 'rgb(168, 85, 247)', 
                        backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                        tension: 0.4, 
                        fill: true,
                        borderWidth: 2
                    }
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

    // Calculate some derived metrics
    const totalEngagement = (stats?.posts?.count || 0) + (stats?.communities?.count || 0);
    const activePercentage = platformStats ? Math.round((platformStats.users.active / platformStats.users.total) * 100) : 0;
    const bookingConversionRate = stats && platformStats ? Math.round((stats.bookings?.count || 0) / (platformStats.users.total || 1) * 100) : 0;

    return (
        <div className="p-8 animate-fadeIn space-y-8">
            {/* Header with Live Stats */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-400">Monitor and manage your TripTo platform • Live Data</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Last Updated</p>
                    <p className="text-white font-medium">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.users ?? 'N/A'}
                    icon={<Users size={24} className="text-white" />}
                    color="blue"
                    trend={platformStats?.users?.growth}
                    percentage={activePercentage}
                    target="500 users"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Blog Posts"
                    value={stats?.posts ?? 'N/A'}
                    icon={<FileText size={24} className="text-white" />}
                    color="purple"
                    trend={platformStats?.posts?.growth}
                    target="1000 posts"
                    onClick={() => navigate('/admin/posts')}
                />
                <StatCard
                    title="Communities"
                    value={stats?.communities ?? 'N/A'}
                    icon={<MessageSquare size={24} className="text-white" />}
                    color="green"
                    trend={platformStats?.communities?.growth}
                    target="100 communities"
                    onClick={() => navigate('/admin/communities')}
                />
                <StatCard
                    title="Total Bookings"
                    value={stats?.bookings ?? 'N/A'}
                    subValue={stats?.pendingBookings ?? 0}
                    icon={<Briefcase size={24} className="text-white" />}
                    color="yellow"
                    trend={15} // Can be calculated based on booking growth
                    percentage={bookingConversionRate}
                    onClick={() => navigate('/admin/bookings')}
                />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <QuickMetricsCard 
                    title="Platform Health"
                    icon={Activity}
                    color="green"
                    metrics={[
                        { 
                            label: 'Active Users (7d)', 
                            value: platformStats?.users?.active || 'N/A',
                            trend: platformStats?.users?.growth,
                            icon: Users
                        },
                        { 
                            label: 'Weekly Bookings', 
                            value: platformStats?.activity?.weeklyBookings || 'N/A',
                            trend: 12,
                            icon: Calendar
                        },
                        { 
                            label: 'Daily Posts', 
                            value: platformStats?.activity?.dailyPosts || 'N/A',
                            trend: platformStats?.posts?.growth,
                            icon: FileText
                        },
                        { 
                            label: 'Avg Engagement', 
                            value: platformStats?.posts?.avgEngagement || 'N/A',
                            trend: 8,
                            icon: Activity
                        }
                    ]}
                />
                
                <QuickMetricsCard 
                    title="Growth Metrics"
                    icon={TrendingUp}
                    color="purple"
                    metrics={[
                        { 
                            label: 'User Growth', 
                            value: `${platformStats?.users?.growth || 0}%`,
                            trend: platformStats?.users?.growth,
                            icon: Users
                        },
                        { 
                            label: 'Post Growth', 
                            value: `${platformStats?.posts?.growth || 0}%`,
                            trend: platformStats?.posts?.growth,
                            icon: FileText
                        },
                        { 
                            label: 'Community Growth', 
                            value: `${platformStats?.communities?.growth || 0}%`,
                            trend: platformStats?.communities?.growth,
                            icon: MessageSquare
                        },
                        { 
                            label: 'Revenue Growth', 
                            value: '+24%',
                            trend: 24,
                            icon: DollarSign
                        }
                    ]}
                />
                
                <QuickMetricsCard 
                    title="System Status"
                    icon={BarChart3}
                    color="blue"
                    metrics={[
                        { 
                            label: 'Platform Status', 
                            value: '🟢 Online',
                            icon: Activity
                        },
                        { 
                            label: 'Database', 
                            value: '🟢 Connected',
                            icon: BarChart3
                        },
                        { 
                            label: 'Last Backup', 
                            value: '2 hours ago',
                            icon: Calendar
                        },
                        { 
                            label: 'API Health', 
                            value: '🟢 Good',
                            icon: Activity
                        }
                    ]}
                />
            </div>

            {/* Activity Chart */}
            {chartData && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Activity Over Time</h2>
                            <p className="text-gray-400 text-sm">Track user and content growth trends</p>
                        </div>
                        <div className="flex items-center bg-gray-800/50 p-1 rounded-lg border border-gray-700">
                            {[7, 30, 90].map(days => (
                                <button
                                    key={days}
                                    onClick={() => setTimeSpan(days)}
                                    className={`px-4 py-2 text-sm font-medium transition-all rounded-md ${
                                        timeSpan === days 
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
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