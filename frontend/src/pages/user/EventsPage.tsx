import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  MapPin,
  ExternalLink,
  PlusCircle,
  Clock,
  Filter,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { CampusEvent, EventCategory } from '../../types/event.types';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/event.service';
import { createEventSchema, CreateEventFormData } from '../../utils/validators';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const EventsPage: React.FC = () => {
  const { events, loading, category, setCategory, refreshEvents } = useEvents();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_SUBMISSIONS'>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const categories: { label: string; value: EventCategory | 'ALL' }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Technical & Coding', value: 'TECHNICAL' },
    { label: 'Hackathons', value: 'HACKATHON' },
    { label: 'Workshops', value: 'WORKSHOP' },
    { label: 'Cultural & Arts', value: 'CULTURAL' },
    { label: 'Sports & Athletic', value: 'SPORTS' },
    { label: 'Seminars', value: 'SEMINAR' },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      category: 'TECHNICAL',
      eventDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    },
  });

  const onSubmitEvent = async (data: CreateEventFormData) => {
    try {
      await eventService.createEvent({
        title: data.title,
        description: data.description,
        category: data.category as EventCategory,
        eventDate: data.eventDate,
        venue: data.venue,
        registrationLink: data.registrationLink || undefined,
        brochureUrl: data.brochureUrl || undefined,
      });
      toast.success('Event submitted for faculty moderation review!');
      setIsSubmitModalOpen(false);
      reset();
      refreshEvents();
    } catch {
      toast.error('Failed to submit event');
    }
  };

  const displayedEvents =
    activeTab === 'MY_SUBMISSIONS'
      ? events.filter((e) => e.createdBy === user?.id)
      : events.filter((e) => e.status === 'PUBLISHED' || e.status === 'APPROVED');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Campus Event Notifications
          </h1>
          <p className="text-sm text-gray-500">
            College symposiums, technical hackathons, cultural festivals, and student club workshops.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsSubmitModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Share an Event
        </Button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'ALL'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MY_SUBMISSIONS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'MY_SUBMISSIONS'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Submissions
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value === 'ALL' ? undefined : cat.value)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border ${
                (cat.value === 'ALL' && !category) || category === cat.value
                  ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-base font-semibold text-gray-900">No events found</h3>
          <p className="mt-1 text-xs text-gray-500">
            {activeTab === 'MY_SUBMISSIONS'
              ? 'You have not submitted any event notices yet.'
              : 'Try choosing another category filter or submit a new notice.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((evt) => (
            <Card key={evt.id} hoverable className="flex flex-col justify-between">
              <div>
                {/* Brochure Thumbnail */}
                <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                  <img
                    src={
                      evt.brochureUrl ||
                      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'
                    }
                    alt={evt.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    <Badge status={evt.status} size="sm" />
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-red-400" />
                    {evt.category}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(evt.eventDate, 'dd MMM yyyy • hh:mm a')}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 line-clamp-1">{evt.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-500 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-between gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(evt)}>
                  View Details
                </Button>

                {evt.registrationLink && (
                  <a
                    href={evt.registrationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                      Register
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        maxWidth="lg"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs sm:text-sm">
            {selectedEvent.brochureUrl && (
              <div className="h-48 rounded-lg overflow-hidden">
                <img
                  src={selectedEvent.brochureUrl}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge status={selectedEvent.status} />
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-xs">
                {selectedEvent.category}
              </span>
            </div>

            <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>

            <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-primary" />
                <span><strong>Date & Time:</strong> {formatDate(selectedEvent.eventDate, 'PPP • p')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-primary" />
                <span><strong>Venue:</strong> {selectedEvent.venue}</span>
              </div>
              {selectedEvent.organizerName && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span><strong>Organizer:</strong> {selectedEvent.organizerName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              {selectedEvent.registrationLink && (
                <a
                  href={selectedEvent.registrationLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="primary" rightIcon={<ExternalLink className="w-4 h-4" />}>
                    Open Registration Page
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* SHARE AN EVENT MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Share Campus Event Notice"
        description="Submit an upcoming club workshop, hackathon or symposium for publishing"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmitEvent)} className="space-y-4">
          <Input
            label="Event Title"
            placeholder="e.g., CodeSprint 2026: 24h Intra-College Coding"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              error={errors.category?.message}
              {...register('category')}
            >
              <option value="TECHNICAL">Technical & Coding</option>
              <option value="HACKATHON">Hackathon</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="CULTURAL">Cultural</option>
              <option value="SPORTS">Sports</option>
              <option value="SEMINAR">Seminar</option>
            </Select>

            <Input
              label="Event Date & Time"
              type="datetime-local"
              error={errors.eventDate?.message}
              {...register('eventDate')}
            />
          </div>

          <Input
            label="Venue / Hall"
            placeholder="e.g. Mechanical Seminar Hall 2"
            error={errors.venue?.message}
            {...register('venue')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Outline eligible batches, topics, cash prizes, and prerequisites..."
              className="w-full text-xs sm:text-sm rounded-lg border border-gray-300 p-2.5 focus:border-primary focus:outline-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>
            )}
          </div>

          <Input
            label="Registration Link (Google Form / Portal URL)"
            placeholder="https://..."
            error={errors.registrationLink?.message}
            {...register('registrationLink')}
          />

          <Input
            label="Poster / Brochure Image URL (optional)"
            placeholder="https://images.unsplash.com/..."
            error={errors.brochureUrl?.message}
            {...register('brochureUrl')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventsPage;
