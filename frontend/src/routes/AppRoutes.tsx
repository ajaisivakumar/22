import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import AuthCallbackPage from '../pages/auth/AuthCallbackPage';

// User Pages
import HomePage from '../pages/user/HomePage';
import ProfilePage from '../pages/user/ProfilePage';
import CGPACalculatorPage from '../pages/user/CGPACalculatorPage';
import ExamCountdownPage from '../pages/user/ExamCountdownPage';
import PollWarsPage from '../pages/user/PollWarsPage';
import EventsPage from '../pages/user/EventsPage';
import PartnerFinderPage from '../pages/user/PartnerFinderPage';
import LostFoundPage from '../pages/user/LostFoundPage';
import ComplaintsPage from '../pages/user/ComplaintsPage';
import LeaderboardPage from '../pages/user/LeaderboardPage';
import NotificationsPage from '../pages/user/NotificationsPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminPollsPage from '../pages/admin/AdminPollsPage';
import AdminEventsPage from '../pages/admin/AdminEventsPage';
import AdminLostFoundPage from '../pages/admin/AdminLostFoundPage';
import AdminComplaintsPage from '../pages/admin/AdminComplaintsPage';
import AdminLeaderboardPage from '../pages/admin/AdminLeaderboardPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

// Error Pages
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Student Portal Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/cgpa-calculator" element={<CGPACalculatorPage />} />
        <Route path="/exam-countdown" element={<ExamCountdownPage />} />
        <Route path="/poll-wars" element={<PollWarsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/partner-finder" element={<PartnerFinderPage />} />
        <Route path="/lost-found" element={<LostFoundPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin Module Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="polls" element={<AdminPollsPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="lost-found" element={<AdminLostFoundPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="leaderboard" element={<AdminLeaderboardPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
