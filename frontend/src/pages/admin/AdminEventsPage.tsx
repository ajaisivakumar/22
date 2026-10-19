import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Trash2, Clock, MapPin, Eye } from 'lucide-react';
import { CampusEvent, EventStatus } from '../../types/event.types';
import { eventService } from '../../services/event.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [modNote, setModNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.adminGetAllEvents();
      setEvents(data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: EventStatus) => {
    try {
      setIsProcessing(true);
      await eventService.updateEventStatus(id, newStatus, modNote || undefined);
      toast.success(`Event status set to ${newStatus}`);
      setSelectedEvent(null);
      setModNote('');
      loadEvents();
    } catch {
      toast.error('Failed to update event');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eventService.deleteEvent(id);
      toast.success('Event deleted');
      loadEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const pendingEvents = events.filter((e) => e.status === 'PENDING');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Event Approvals & Moderation Desk
        </h1>
        <p className="text-sm text-gray-500">
          Review student club notices, symposium proposals, hackathon dates, and publish onto campus feed.
        </p>
      </div>

      {/* Pending Queue Highlight */}
      {pendingEvents.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/30">
          <CardHeader className="bg-amber-100/50">
            <CardTitle className="text-amber-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pending Moderation Queue ({pendingEvents.length})
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-amber-200/60">
            {pendingEvents.map((evt) => (
              <div key={evt.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{evt.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{evt.venue} • {formatDate(evt.eventDate)}</p>
                  <p className="text-xs text-amber-800 mt-1">Organizer: {evt.organizerName || 'Student submission'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleUpdateStatus(evt.id, 'PUBLISHED')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleUpdateStatus(evt.id, 'REJECTED')}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campus Events Directory</CardTitle>
          <CardDescription>Published, archived, and rejected event items</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Loading events...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No events found</td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 max-w-xs truncate">{e.title}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{e.category}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(e.eventDate)}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 truncate max-w-[150px]">{e.venue}</td>
                    <td className="py-3 px-4">
                      <Badge status={e.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedEvent(e)}
                          title="Review Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(e.id)}
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EVENT MODERATION DETAIL MODAL */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        maxWidth="md"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>

            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <p><strong>Venue:</strong> {selectedEvent.venue}</p>
              <p><strong>Date:</strong> {formatDate(selectedEvent.eventDate)}</p>
              <p><strong>Registration URL:</strong> {selectedEvent.registrationLink || 'None provided'}</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Moderator Notes (optional)</label>
              <textarea
                rows={2}
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                placeholder="Reason for rejection or approval note..."
                className="w-full text-xs rounded border border-gray-300 p-2 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleUpdateStatus(selectedEvent.id, 'REJECTED')}
                isLoading={isProcessing}
              >
                Reject Notice
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleUpdateStatus(selectedEvent.id, 'PUBLISHED')}
                isLoading={isProcessing}
              >
                Approve & Publish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminEventsPage;
