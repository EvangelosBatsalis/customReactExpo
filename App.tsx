
import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserProfile, FamilyMembership, Family } from './types';
import { authService } from './services/authService';
import { mockDb } from './services/mockDb';

// Pages
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Layout } from './components/Layout';

// Contexts
const AuthContext = createContext<{
  user: UserProfile | null;
  loading: boolean;
}>({ user: null, loading: true });

const FamilyContext = createContext<{
  activeFamily: Family | null;
  families: FamilyMembership[];
  setActiveFamily: (id: string | null) => void;
  refreshFamilies: () => void;
}>({ activeFamily: null, families: [], setActiveFamily: () => {}, refreshFamilies: () => {} });

export const useAuth = () => useContext(AuthContext);
export const useFamily = () => useContext(FamilyContext);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { activeFamily, families } = useFamily();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-indigo-600 animate-pulse">Loading Famly...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // If user has no families and not on onboarding, redirect
  if (families.length === 0 && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<FamilyMembership[]>([]);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);
    if (u) {
      const f = mockDb.getFamiliesForUser(u.id);
      setFamilies(f);
      if (f.length > 0) setActiveFamilyId(f[0].familyId);
    }
    setLoading(false);
  }, []);

  const refreshFamilies = () => {
    if (user) {
      const f = mockDb.getFamiliesForUser(user.id);
      setFamilies(f);
    }
  };

  const activeFamily = families.find(f => f.familyId === activeFamilyId)?.family || null;

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <FamilyContext.Provider value={{ 
        activeFamily, 
        families, 
        setActiveFamily: setActiveFamilyId,
        refreshFamilies
      }}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/calendar" element={<div className="p-8 text-center text-slate-400 font-medium">Calendar feature coming soon in this demo...</div>} />
                      <Route path="/shopping" element={<div className="p-8 text-center text-slate-400 font-medium">Shopping lists feature coming soon in this demo...</div>} />
                      <Route path="/members" element={<div className="p-8 text-center text-slate-400 font-medium">Members management feature coming soon in this demo...</div>} />
                      <Route path="/settings" element={<div className="p-8 text-center text-slate-400 font-medium">Settings feature coming soon in this demo...</div>} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </FamilyContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
