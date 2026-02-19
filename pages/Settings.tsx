
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useFamily } from '../App';
import { LogOut, Plus, User, Bell, Shield } from 'lucide-react';
import { authService } from '../services/authService';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const { activeFamily } = useFamily();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authService.signOut();
        navigate('/login');
    };

    const handleCreateFamily = () => {
        navigate('/onboarding?mode=create'); // We'll need to support this query param in Onboarding
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
                        <p className="text-slate-500">{user?.email}</p>
                    </div>
                </div>
                <div className="p-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-left">
                        <User className="w-5 h-5 text-slate-400" />
                        <span className="font-medium">Edit Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-left">
                        <Bell className="w-5 h-5 text-slate-400" />
                        <span className="font-medium">Notifications</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-left">
                        <Shield className="w-5 h-5 text-slate-400" />
                        <span className="font-medium">Privacy & Security</span>
                    </button>
                </div>
            </div>

            {/* Family Management */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">Family Management</h3>
                </div>
                <div className="p-4 space-y-3">
                    <button
                        onClick={handleCreateFamily}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Family
                    </button>

                    {activeFamily && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <p className="text-sm text-indigo-800 mb-1">Current Family</p>
                            <p className="font-bold text-indigo-900 text-lg">{activeFamily.name}</p>
                            <p className="text-xs text-indigo-600 mt-2">ID: {activeFamily.id}</p>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    );
};
