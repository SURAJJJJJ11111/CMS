import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, BarChart3, AlertTriangle,
  LogOut, User, ChevronRight, Bell
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/complaints',  label: 'Complaints',  icon: Ticket },
    ...(isManager() ? [
      { to: '/analytics',   label: 'Analytics',   icon: BarChart3 },
      { to: '/escalations', label: 'Escalations', icon: AlertTriangle },
    ] : []),
  ];

  const roleColor = {
    USER: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    AGENT: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    MANAGER: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  };

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Ticket size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Complaint</h1>
              <p className="text-primary-400 text-xs font-medium">Management System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 mb-3">
            <div className="w-9 h-9 bg-primary-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColor[user?.role]}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>CMS</span>
            <ChevronRight size={14} />
            <span className="text-white font-medium capitalize">Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <User size={16} />
              <span>{user?.department || 'All Depts'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
