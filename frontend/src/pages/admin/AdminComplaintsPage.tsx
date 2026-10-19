import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  Wrench,
  XCircle,
  Filter,
  Monitor,
} from 'lucide-react';
import { LabComplaint, ComplaintStatus } from '../../types/complaint.types';
import { complaintService } from '../../services/complaint.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<LabComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [activeComplaint, setActiveComplaint] = useState<LabComplaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintService.getAllComplaints();
      setComplaints(data);
    } catch {
      toast.error('Failed to load lab complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ComplaintStatus) => {
    try {
      await complaintService.updateComplaintStatus(id, newStatus, resolutionNotes || undefined);
      toast.success(`Complaint status set to ${newStatus}`);
      setActiveComplaint(null);
      setResolutionNotes('');
      loadComplaints();
    } catch {
      toast.error('Failed to update complaint status');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    const matchesFloor = selectedFloor === 'ALL' || c.floor === selectedFloor;
    return matchesStatus && matchesFloor;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6 text-primary" />
          Hardware & Lab Maintenance Desk
        </h1>
        <p className="text-sm text-gray-500">
          Track and resolve student-submitted anonymous computer terminal tickets.
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardBody className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <div className="w-44">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>

            <div className="w-44">
              <Select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
              >
                <option value="ALL">All Floors</option>
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
              </Select>
            </div>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing {filteredComplaints.length} tickets
          </div>
        </CardBody>
      </Card>

      {/* Complaints Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Lab / Location</th>
                <th className="py-3 px-4">Terminal</th>
                <th className="py-3 px-4">Reported Issue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading complaints...</td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No complaints matching filter</td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{c.referenceId}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900 text-xs">{c.lab}</p>
                      <p className="text-[11px] text-gray-400">{c.floor}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">{c.systemNumber}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-700">{c.description}</td>
                    <td className="py-3 px-4">
                      <Badge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActiveComplaint(c);
                          setResolutionNotes(c.adminNotes || '');
                        }}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* UPDATE MODAL */}
      <Modal
        isOpen={!!activeComplaint}
        onClose={() => setActiveComplaint(null)}
        title={`Manage Ticket: ${activeComplaint?.referenceId}`}
        maxWidth="md"
      >
        {activeComplaint && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <p><strong>Location:</strong> {activeComplaint.floor} • {activeComplaint.lab}</p>
              <p><strong>Machine:</strong> {activeComplaint.systemNumber}</p>
              <p><strong>Problem Description:</strong> {activeComplaint.description}</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Maintenance Technician Note</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Dispatched hardware team, replaced mouse..."
                className="w-full text-xs rounded border border-gray-300 p-2 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleUpdateStatus(activeComplaint.id, 'IN_PROGRESS')}
              >
                Mark In Progress
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-brand-blue hover:bg-blue-700"
                onClick={() => handleUpdateStatus(activeComplaint.id, 'RESOLVED')}
              >
                Mark Resolved
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleUpdateStatus(activeComplaint.id, 'REJECTED')}
              >
                Reject Ticket
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminComplaintsPage;
