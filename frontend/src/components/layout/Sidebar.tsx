import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Flame,
  Calendar,
  Users2,
  PackageSearch,
  MessageSquareWarning,
  Calculator,
  Timer,
  Trophy,
  Bell,
  User,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Home Feed', href: '/', icon: Home },
    { name: 'Classroom Poll Wars', href: '/poll-wars', icon: Flame, badge: 'Hot' },
    { name: 'Campus Events', href: '/events', icon: Calendar },
    { name: 'Find Your Team', href: '/partner-finder', icon: Users2 },
    { name: 'Campus Lost & Found', href: '/lost-found', icon: PackageSearch },
    { name: 'Anonymous Lab Complaint', href: '/complaints', icon: MessageSquareWarning },
    { name: 'CGPA Calculator', href: '/cgpa-calculator', icon: Calculator },
    { name: 'Exam Timetable & Prep', href: '/exam-countdown', icon: Timer },
    { name: 'Academic Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile & Settings', href: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:translate-x-0 overflow-y-auto flex flex-col justify-between',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="py-4 px-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Student Community
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-red-50 text-primary font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-primary uppercase">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info & Admin shortcut */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin/dashboard"
              onClick={() => onClose()}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
            >
              <Shield className="w-4 h-4 text-red-400" />
              <span>Admin Management</span>
            </NavLink>
          )}

          <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px] text-gray-500 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700">Need Assistance?</p>
              <p className="mt-0.5 text-gray-500">Contact Student Welfare or submit an anonymous complaint.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
