
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, CheckSquare, Calendar, ShoppingCart,
  Settings, LogOut, Users, ChevronDown, Plus
} from 'lucide-react';
import { authService } from '../services/authService';
import { useFamily } from '../App';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
      }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeFamily, families, setActiveFamily } = useFamily();
  const location = useLocation();
  const navigate = useNavigate();
  const [isFamilyMenuOpen, setIsFamilyMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic">F</div>
            <span className="text-xl font-bold tracking-tight">Famly</span>
          </Link>

          {/* Family Switcher */}
          <div className="relative mb-8">
            <button
              onClick={() => setIsFamilyMenuOpen(!isFamilyMenuOpen)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                  {activeFamily?.name.charAt(0)}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-semibold truncate leading-tight">{activeFamily?.name}</p>
                  <p className="text-xs text-slate-500">Active Family</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-transform ${isFamilyMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFamilyMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Switch Family</p>
                {families.map(membership => (
                  <button
                    key={membership.familyId}
                    onClick={() => {
                      setActiveFamily(membership.family?.id || null);
                      setIsFamilyMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors ${activeFamily?.id === membership.familyId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                      }`}
                  >
                    <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold">
                      {membership.family?.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium truncate">{membership.family?.name}</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 my-2 pt-2">
                  <Link
                    to="/onboarding"
                    className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add New Family</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Dashboard" active={location.pathname === '/'} />
            <NavItem to="/tasks" icon={<CheckSquare className="w-5 h-5" />} label="Tasks" active={location.pathname.startsWith('/tasks')} />
            <NavItem to="/calendar" icon={<Calendar className="w-5 h-5" />} label="Calendar" active={location.pathname.startsWith('/calendar')} />
            <NavItem to="/shopping" icon={<ShoppingCart className="w-5 h-5" />} label="Shopping" active={location.pathname.startsWith('/shopping')} />
            <NavItem to="/members" icon={<Users className="w-5 h-5" />} label="Members" active={location.pathname.startsWith('/members')} />
            <NavItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" active={location.pathname.startsWith('/settings')} />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 md:hidden bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <span className="font-bold text-lg text-indigo-600">Famly</span>
          <button onClick={() => setIsFamilyMenuOpen(!isFamilyMenuOpen)}>
            <Home className="w-6 h-6 text-slate-600" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};
