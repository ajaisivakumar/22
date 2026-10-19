import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserX,
  UserCheck,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { User, UserRole } from '../../types/auth.types';
import { adminService } from '../../services/admin.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Confirmation modal state
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'ACTIVATE' | 'CHANGE_ROLE' | null>(null);
  const [newRoleInput, setNewRoleInput] = useState<UserRole>('STUDENT');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionUser || !actionType) return;
    try {
      setIsProcessing(true);
      if (actionType === 'SUSPEND') {
        await adminService.updateUserStatus(actionUser.id, 'SUSPENDED');
        toast.success(`Account for ${actionUser.name} suspended`);
      } else if (actionType === 'ACTIVATE') {
        await adminService.updateUserStatus(actionUser.id, 'ACTIVE');
        toast.success(`Account for ${actionUser.name} reactivated`);
      } else if (actionType === 'CHANGE_ROLE') {
        await adminService.updateUserRole(actionUser.id, newRoleInput);
        toast.success(`Role for ${actionUser.name} changed to ${newRoleInput}`);
      }
      setActionUser(null);
      setActionType(null);
      loadUsers();
    } catch {
      toast.error('Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus;

    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          User Account Directory
        </h1>
        <p className="text-sm text-gray-500">
          Search, audit, and regulate student, faculty, and administrator accounts across all departments.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-72">
            <Input
              placeholder="Search by student name, email, branch..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="w-36">
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>

            <div className="w-36">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Batch</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {u.department || 'General'}{' '}
                      {u.batch && <span className="text-gray-400">({u.batch})</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={u.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActionUser(u);
                            setNewRoleInput(u.role);
                            setActionType('CHANGE_ROLE');
                          }}
                        >
                          Role
                        </Button>

                        {u.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setActionUser(u);
                              setActionType('SUSPEND');
                            }}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setActionUser(u);
                              setActionType('ACTIVATE');
                            }}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Dialog Modal */}
      <Modal
        isOpen={!!actionUser}
        onClose={() => setActionUser(null)}
        title={
          actionType === 'SUSPEND'
            ? 'Confirm Account Suspension'
            : actionType === 'ACTIVATE'
            ? 'Reactivate Account'
            : 'Change User Role'
        }
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {actionType === 'SUSPEND' && (
            <p className="text-gray-600">
              Are you sure you want to suspend <strong>{actionUser?.name}</strong>? They will be unable to log in, vote in poll wars, or post messages until unbanned.
            </p>
          )}

          {actionType === 'ACTIVATE' && (
            <p className="text-gray-600">
              Restore access for <strong>{actionUser?.name}</strong>?
            </p>
          )}

          {actionType === 'CHANGE_ROLE' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">Select New Role</label>
              <Select
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value as UserRole)}
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMIN">Administrator</option>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setActionUser(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'SUSPEND' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmAction}
              isLoading={isProcessing}
            >
              Confirm Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
