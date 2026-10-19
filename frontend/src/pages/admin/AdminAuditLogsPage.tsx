import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Shield } from 'lucide-react';
import { AuditLog, adminService } from '../../services/admin.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actorId ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.eventType === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Security & Audit Logs
        </h1>
        <p className="text-sm text-gray-500">
          Immutable event log tracing user status changes, moderation actions, and administrative activity.
        </p>
      </div>

      <Card>
        <CardBody className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by action, email, target..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Event Types</option>
              <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
              <option value="EVENT_APPROVED">EVENT_APPROVED</option>
              <option value="USER_SUSPENDED">USER_SUSPENDED</option>
              <option value="COMPLAINT_RESOLVED">COMPLAINT_RESOLVED</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Event Code</th>
                <th className="py-3 px-4">Actor Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Loading audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No audit events found</td>
                </tr>
              ) : (
                  filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{log.eventType}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{log.actorId ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-semibold">
                        {log.actorRole ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{log.targetType ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs">{log.description || '–'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
