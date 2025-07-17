import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminLoginPage({ onAdminLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/admin/login', { email, password });
            onAdminLogin(data.user, data.token);
            toast.success('Welcome, Admin!');
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-dots">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-auto text-yellow-400" />
                    <h2 className="mt-6 text-3xl font-bold text-white">Admin Studio Login</h2>
                    <p className="mt-2 text-sm text-gray-400">Access to this area is restricted.</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-primary"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-primary"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}