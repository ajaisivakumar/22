import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Flame,
  Calendar,
  PackageSearch,
  MessageSquareWarning,
  Trophy,
  History,
  Shield,
  ArrowLeft,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminNav = [
    { name: 'Dashboard Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Poll Wars Moderation', href: '/admin/polls', icon: Flame },
    { name: 'Events Approval Queue', href: '/admin/events', icon: Calendar },
    { name: 'Lost & Found Queue', href: '/admin/lost-found', icon: PackageSearch },
    { name: 'Lab Complaints Desk', href: '/admin/complaints', icon: MessageSquareWarning },
    { name: 'Leaderboard Verification', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Security & Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 h-16 bg-gray-900 border-b border-gray-800 text-white shadow-sm">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg"
              aria-label="Toggle admin navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">Admin Console</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-white uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Student Portal
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Admin Sidebar */}
        <aside
          className={cn(
            'fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-200 md:translate-x-0 overflow-y-auto flex flex-col justify-between',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="py-4 px-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Administration Modules
            </div>

            <nav className="space-y-1">
              {adminNav.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-red-50 text-primary font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            <p className="font-semibold text-gray-700">{user?.name || 'Administrator'}</p>
            <p className="truncate text-gray-400">{user?.email || 'admin@campus.edu'}</p>
            <p className="mt-2 text-[10px] text-gray-400">Campus Connect System v1.0</p>
          </div>
        </aside>

        {/* Admin Main Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
