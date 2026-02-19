
import { UserProfile } from '../types';
import { mockDb } from './mockDb';

const AUTH_KEY = 'famly_session';

export const authService = {
  getCurrentUser: (): UserProfile | null => {
    const session = localStorage.getItem(AUTH_KEY);
    return session ? JSON.parse(session) : null;
  },

  login: (email: string, name: string): UserProfile => {
    // Basic mock login - in real life this calls an API and gets a JWT
    const existing = mockDb.getProfile(email); // using email as ID for simple mock
    const profile: UserProfile = existing || {
      id: email, // simple mock ID
      email,
      fullName: name,
    };
    mockDb.saveProfile(profile);
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
    return profile;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.hash = '/login';
  },

  isAuthenticated: () => !!localStorage.getItem(AUTH_KEY)
};
