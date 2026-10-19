import { Router } from 'express';
import { db, EventRecord } from '../db/store';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

export const eventRouter = Router();

eventRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { category, status } = req.query;
  const role = req.user?.role;
  const isStaff = role === 'ADMIN' || role === 'MODERATOR';
  let list = db.events;
  if (!isStaff) {
    list = list.filter(
      (e) =>
        e.status === 'PUBLISHED' ||
        e.status === 'APPROVED' ||
        (!!req.user && e.createdBy === req.user.id)
    );
  }
  if (category && category !== 'ALL') {
    list = list.filter((e) => e.category === category);
  }
  if (status) {
    list = list.filter((e) => e.status === status);
  }
  res.json({ events: list });
});

eventRouter.get('/my', authenticate, (req: AuthenticatedRequest, res) => {
  const list = db.events.filter((e) => e.createdBy === req.user?.id);
  res.json({ events: list });
});

eventRouter.get('/:id', (req, res) => {
  const evt = db.events.find((e) => e.id === req.params.id);
  if (!evt) return res.status(404).json({ message: 'Event not found' });
  res.json({ event: evt });
});

eventRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { title, description, category, eventDate, venue, registrationLink, brochureUrl } = req.body;
  if (!title || !description || !eventDate || !venue) {
    return res.status(400).json({ message: 'Missing required event fields' });
  }

  const newEvent: EventRecord = {
    id: 'evt-' + Date.now(),
    title,
    description,
    category: category || 'TECHNICAL',
    eventDate,
    venue,
    registrationLink,
    brochureUrl: brochureUrl || undefined,
    status: 'PENDING',
    organizerName: req.user?.name || 'Student Submitter',
    createdBy: req.user?.id,
    createdAt: new Date().toISOString(),
  };

  db.events.unshift(newEvent);
  res.status(201).json({ event: newEvent });
});

function applyEventPatch(evt: EventRecord, body: Record<string, unknown>) {
  if (typeof body.title === 'string') evt.title = body.title;
  if (typeof body.description === 'string') evt.description = body.description;
  if (typeof body.category === 'string') evt.category = body.category as EventRecord['category'];
  if (typeof body.eventDate === 'string') evt.eventDate = body.eventDate;
  if (typeof body.venue === 'string') evt.venue = body.venue;
  if (typeof body.registrationLink === 'string') evt.registrationLink = body.registrationLink;
  if (typeof body.brochureUrl === 'string') evt.brochureUrl = body.brochureUrl;
  if (typeof body.status === 'string') evt.status = body.status as EventRecord['status'];
  if (typeof body.notes === 'string') evt.moderatorNotes = body.notes;
  if (typeof body.moderatorNotes === 'string') evt.moderatorNotes = body.moderatorNotes;
}

eventRouter.patch('/:id', authenticate, (req, res) => {
  const evt = db.events.find((e) => e.id === req.params.id);
  if (!evt) return res.status(404).json({ message: 'Event not found' });
  applyEventPatch(evt, req.body);
  res.json({ event: evt });
});

eventRouter.patch('/:id/status', authenticate, (req, res) => {
  const evt = db.events.find((e) => e.id === req.params.id);
  if (!evt) return res.status(404).json({ message: 'Event not found' });
  applyEventPatch(evt, req.body);
  res.json({ event: evt });
});

eventRouter.post('/:id/report', authenticate, (_req, res) => {
  res.json({ message: 'Report received. A moderator will review this event.' });
});

eventRouter.delete('/:id', authenticate, (req, res) => {
  db.events = db.events.filter((e) => e.id !== req.params.id);
  res.json({ message: 'Event removed' });
});

export default eventRouter;
