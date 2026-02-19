
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { useAuth, useFamily } from '../App';
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export const Join: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setActiveFamily } = useFamily();
    const code = searchParams.get('code');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [familyDetails, setFamilyDetails] = useState<{ name: string } | null>(null);

    useEffect(() => {
        if (!code) {
            setStatus('error');
            setMessage('Invalid invite link. Code is missing.');
            return;
        }
        checkInvite();
    }, [code]);

    const checkInvite = async () => {
        try {
            if (!code) return;
            // Verify invite with Supabase
            const invite = await supabaseService.getInvite(code);

            if (invite) {
                setFamilyDetails({ name: invite.familyName });

                if (user) {
                    // Auto-join if logged in
                    await joinFamily(invite.id, invite.familyId);
                } else {
                    // Prompt to login/signup
                    setStatus('success'); // Show "Ready to join" state
                }
            } else {
                setStatus('error');
                setMessage('Invite code not found or expired.');
            }

        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Failed to verify invite. It may be invalid or expired.');
        }
    };

    const joinFamily = async (inviteId: string, familyId: string) => {
        if (!user) return;

        try {
            // 1. Accept invite (updates status)
            await supabaseService.acceptInvite(inviteId);

            // 2. Add to family members
            await supabaseService.addFamilyMember(familyId, user.id, 'MEMBER');

            // 3. Switch to this family
            setActiveFamily(familyId);

            // 4. Redirect
            navigate('/');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Failed to join family. Please try again.');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Verifying invite...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invite Error</h1>
                    <p className="text-slate-500 mb-8">{message}</p>
                    <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    // Success state (but not auto-joined yet because not logged in)
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Invited!</h1>
                <p className="text-slate-500 mb-8">
                    You have been invited to join <strong>{familyDetails?.name}</strong> on Famify.
                </p>

                <div className="space-y-3">
                    <Link
                        to={`/login?redirect=/join?code=${code}`}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        Log In to Join
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        to={`/login?mode=signup&redirect=/join?code=${code}`}
                        className="w-full flex items-center justify-center px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-indigo-100 hover:text-indigo-600 transition-colors"
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};
