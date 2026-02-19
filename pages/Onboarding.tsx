
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, useFamily } from '../App';
import { supabaseService } from '../services/supabaseService';
import { PlusCircle, Link as LinkIcon, ArrowRight, Home } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshFamilies, setActiveFamily } = useFamily();

  const mode = searchParams.get('mode');
  const [step, setStep] = useState<'choice' | 'create' | 'join'>(mode === 'create' ? 'create' : 'choice');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || !user) return;
    try {
      const family = await supabaseService.createFamily(familyName, user.id);
      await refreshFamilies();
      setActiveFamily(family.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to create family.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;
    try {
      // Logic for joining via code manually (less common now with links, but good backup)
      // This assumes we have a way to lookup by code.
      // We can use getInvite(code) then acceptInvite(id)
      const invite = await supabaseService.getInvite(inviteCode.toUpperCase());
      if (!invite) throw new Error("Invalid code");

      await supabaseService.acceptInvite(invite.id);
      await supabaseService.addFamilyMember(invite.familyId, user.id, 'MEMBER');

      await refreshFamilies();
      setActiveFamily(invite.familyId);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Invalid or expired invite code');
    }
  };

  const handleLogout = async () => {
    await import('../services/authService').then(m => m.authService.signOut());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 relative">
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 text-indigo-200 hover:text-white font-bold text-sm"
      >
        Sign Out
      </button>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Let's set up your family</h1>
          <p className="text-slate-500 mt-2">Every family needs a base. You can create a new one or join an existing one.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('create')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Create a New Family</p>
                <p className="text-sm text-slate-500">Start a fresh household and invite others</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Join Existing Family</p>
                <p className="text-sm text-slate-500">Use an invite code sent by a family member</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        )}

        {step === 'create' && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Family Name</label>
              <input
                type="text"
                placeholder="e.g. The Smiths, Downtown Apartment"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                Create Family
              </button>
            </div>
          </form>
        )}

        {step === 'join' && (
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Invite Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-center text-lg tracking-widest font-mono"
                autoFocus
                maxLength={6}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
              >
                Join Family
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
