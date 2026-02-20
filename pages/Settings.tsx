import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useFamily } from '../App';
import { LogOut, Plus, User, Bell, Shield, Trash2, Mail, Users, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { supabaseService } from '../services/supabaseService';
import { FamilyInvite, FamilyMembership, FamilyRole, InviteStatus } from '../types';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const { activeFamily, setActiveFamily, refreshFamilies } = useFamily();
    const navigate = useNavigate();

    const [members, setMembers] = useState<FamilyMembership[]>([]);
    const [invites, setInvites] = useState<FamilyInvite[]>([]);

    const myMembership = members.find(m => m.userId === user?.id);
    const amIAdmin = myMembership?.role === FamilyRole.OWNER || myMembership?.role === FamilyRole.ADMIN;

    useEffect(() => {
        const fetchSettingsData = async () => {
            if (activeFamily) {
                try {
                    const [fetchedMembers, fetchedInvites] = await Promise.all([
                        supabaseService.getFamilyMembers(activeFamily.id),
                        supabaseService.getFamilyInvites(activeFamily.id)
                    ]);
                    setMembers(fetchedMembers as FamilyMembership[]);
                    setInvites(fetchedInvites as FamilyInvite[]);
                } catch (error) {
                    console.error("Error fetching settings data:", error);
                }
            }
        };
        fetchSettingsData();
    }, [activeFamily]);

    const handleLogout = async () => {
        await authService.signOut();
        navigate('/login');
    };

    const handleCreateFamily = () => {
        navigate('/onboarding?mode=create');
    };

    const handleDeleteFamily = async () => {
        if (!activeFamily) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to permanently delete the family "${activeFamily.name}"? This action cannot be undone.`
        );

        if (confirmDelete) {
            try {
                await supabaseService.deleteFamily(activeFamily.id);
                setActiveFamily(null);
                refreshFamilies(); // Trigger a refresh in App
                navigate('/onboarding');
            } catch (err) {
                console.error("Failed to delete family:", err);
                alert("Failed to delete family. You may not have permission.");
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
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
            {activeFamily && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            {activeFamily.name} Members
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {members.map(member => (
                            <div key={member.userId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                                        {member.profile?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{member.profile?.fullName || 'Unknown User'}</p>
                                        <p className="text-xs text-slate-500">{member.profile?.email}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.role === FamilyRole.OWNER || member.role === FamilyRole.ADMIN
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}>
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invites Management (Only for Admins) */}
            {activeFamily && amIAdmin && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-500" />
                            Invites
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {invites.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No pending or revoked invites found.</p>
                        ) : (
                            invites.map(invite => (
                                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-white gap-3 shadow-sm">
                                    <div>
                                        <p className="font-bold text-slate-800">{invite.email}</p>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            Code: <span className="font-mono bg-slate-100 px-1.5 py-0.5 text-slate-700 rounded-md tracking-wider">{invite.inviteCode}</span>
                                            <span className="text-slate-300">•</span>
                                            Role: {invite.role}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {invite.status === InviteStatus.PENDING && (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                                                <Clock className="w-3.5 h-3.5" /> PENDING
                                            </span>
                                        )}
                                        {invite.status === InviteStatus.ACCEPTED && (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
                                            </span>
                                        )}
                                        {invite.status === InviteStatus.REVOKED && (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                                                <XCircle className="w-3.5 h-3.5" /> REJECTED / REVOKED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <button className="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors">
                            <Plus className="w-5 h-5" /> Send Invite
                        </button>
                    </div>
                </div>
            )}

            {/* General Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-2 p-4">
                <button
                    onClick={handleCreateFamily}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                    <Plus className="w-5 h-5 text-slate-400" />
                    Create Another Family
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                    <LogOut className="w-5 h-5 text-slate-500" />
                    Sign Out
                </button>
            </div>

            {/* Danger Zone */}
            {activeFamily && amIAdmin && (
                <div className="mt-12 rounded-2xl border-2 border-red-100 bg-red-50/50 p-6 shadow-sm">
                    <h3 className="text-red-800 font-bold text-lg mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Danger Zone
                    </h3>
                    <p className="text-red-600 text-sm mb-6 max-w-lg">
                        Permanently delete this entire family, including all tasks, calendar events, and shopping lists. This action is irreversible.
                    </p>
                    <button
                        onClick={handleDeleteFamily}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 border border-red-700"
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete "{activeFamily.name}" Family
                    </button>
                </div>
            )}
        </div>
    );
};
