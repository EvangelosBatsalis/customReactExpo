
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';


export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !name) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await authService.signUp(email, password, name);
        // If auto-confirm is enabled, they might be logged in. 
        // Or they might need to confirm email.
        // For this demo, let's assume they might need to check email or are logged in.
        // But checking session is best.
        const user = await authService.getCurrentUser();
        if (user) {
          navigate('/');
        } else {
          setError('Please check your email to confirm your account.');
        }
      } else {
        await authService.signIn(email, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold italic text-xl">F</div>
            <span className="text-2xl font-bold tracking-tight">Famly</span>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-slate-500 mt-2">{isSignUp ? 'Start organizing your family today.' : 'Sign in to your account.'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required={isSignUp}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-600 font-bold hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
