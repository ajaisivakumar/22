import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Flame,
  Calendar,
  PackageSearch,
  MessageSquareWarning,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { AdminDashboardMetrics, AuditLogItem } from '../../types/admin.types';
import { adminService } from '../../services/admin.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRelativeTime } from '../../utils/format';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [m, logs] = await Promise.all([
          adminService.getMetrics(),
          adminService.getAuditLogs(),
        ]);
        setMetrics(m);
        setRecentLogs(logs.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            System Administration Center
          </h1>
          <p className="text-sm text-gray-500">
            Overall telemetry, moderation queues, user accounts, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Platform Operational
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      {loading || !metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Total Users</span>
                <Users className="w-4 h-4 text-brand-blue" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
              <p className="text-[11px] text-gray-500">
                {metrics.activeUsers} active • {metrics.suspendedUsers} suspended
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Active Polls</span>
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.activePolls}</p>
              <p className="text-[11px] text-gray-500">Classroom discussions live</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Open Lab Issues</span>
                <MessageSquareWarning className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{metrics.openComplaints}</p>
              <p className="text-[11px] text-gray-500">Hardware tickets awaiting action</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Published Events</span>
                <Calendar className="w-4 h-4 text-brand-green" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.publishedEvents}</p>
              <p className="text-[11px] text-gray-500">Campus notices visible</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Module Navigation Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Moderation Queues */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Administrative Moderation Queues</CardTitle>
            <CardDescription>Direct shortcuts to pending review items</CardDescription>
          </CardHeader>
          <CardBody className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/admin/events"
              className="p-3.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-red-50/20 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Events Approval</h4>
                  <p className="text-[11px] text-gray-500">Review student submissions</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/complaints"
              className="p-3.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-red-50/20 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Lab Complaint Desk</h4>
                  <p className="text-[11px] text-gray-500">Update hardware ticket status</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/users"
              className="p-3.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-red-50/20 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-primary flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">User Accounts</h4>
                  <p className="text-[11px] text-gray-500">Manage student roles & status</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              to="/admin/polls"
              className="p-3.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-red-50/20 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Poll Wars Admin</h4>
                  <p className="text-[11px] text-gray-500">Create & close official polls</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>
          </CardBody>
        </Card>

        {/* Security & System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Platform Health</CardTitle>
          </CardHeader>
          <CardBody className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Database Engine:</span>
              <span className="font-semibold text-emerald-600">PostgreSQL (Online)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Session Cookie Security:</span>
              <span className="font-semibold text-gray-800">HttpOnly / Strict</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">Active Audit Tracing:</span>
              <span className="font-semibold text-gray-800">Enabled (24h Window)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-600">Failed Logins (24h):</span>
              <span className="font-semibold text-gray-800">0 flagged events</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Audit Log Preview */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Audit Trail Logs</CardTitle>
            <CardDescription>Administrative moderation actions and access changes</CardDescription>
          </div>
          <Link to="/admin/audit-logs">
            <Button variant="outline" size="sm">
              View All Logs
            </Button>
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/75 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{log.action}</td>
                  <td className="py-2.5 px-4 text-gray-700">{log.actorEmail}</td>
                  <td className="py-2.5 px-4 text-gray-600">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold">
                      {log.targetType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">{log.details || '–'}</td>
                  <td className="py-2.5 px-4 text-right text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
