import { Router } from 'express';
import { db, EventRecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const eventRouter = Router();

eventRouter.get('/', (req, res) => {
  const { category } = req.query;
  let list = db.events;
  if (category && category !== 'ALL') {
    list = list.filter((e) => e.category === category);
  }
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
    brochureUrl: brochureUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
    status: 'PENDING',
    organizerName: req.user?.name || 'Student Submitter',
    createdAt: new Date().toISOString(),
  };

  db.events.unshift(newEvent);
  res.status(201).json({ event: newEvent });
});

eventRouter.patch('/:id/status', authenticate, (req, res) => {
  const { status, notes } = req.body;
  const evt = db.events.find((e) => e.id === req.params.id);
  if (!evt) return res.status(404).json({ message: 'Event not found' });
  if (status) evt.status = status;
  if (notes) evt.moderatorNotes = notes;
  res.json({ event: evt });
});

eventRouter.delete('/:id', authenticate, (req, res) => {
  db.events = db.events.filter((e) => e.id !== req.params.id);
  res.json({ message: 'Event removed' });
});

export default eventRouter;
