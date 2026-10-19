import { Router } from 'express';
import { db, LostFoundRecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const lostfoundRouter = Router();

lostfoundRouter.get('/', (req, res) => {
  const { type, status, category } = req.query;
  let list = db.lostFound.filter((i) => i.status !== 'HIDDEN');
  if (type) list = list.filter((i) => i.type === type);
  if (status) list = list.filter((i) => i.status === status);
  if (category && category !== 'ALL') list = list.filter((i) => i.category === category);
  res.json({ items: list });
});

lostfoundRouter.get('/:id', (req, res) => {
  const item = db.lostFound.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json({ item });
});

lostfoundRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { title, type, category, location, date, description, imageUrl, contactInfo, isSensitive } =
    req.body;
  if (!title || !location || !description) {
    return res.status(400).json({ message: 'Title, location, and description are required' });
  }
  const newItem: LostFoundRecord = {
    id: 'lf-' + Date.now(),
    title,
    type: type || 'FOUND',
    category: category || 'Other',
    location,
    date: date || new Date().toISOString().slice(0, 10),
    description,
    imageUrl,
    contactInfo,
    isSensitive: !!isSensitive,
    status: 'OPEN',
    createdBy: req.user?.id,
    createdAt: new Date().toISOString(),
  };

  db.lostFound.unshift(newItem);
  res.status(201).json({ item: newItem });
});

lostfoundRouter.patch('/:id', authenticate, (req, res) => {
  const item = db.lostFound.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (req.body.status) item.status = req.body.status;
  res.json({ item });
});

lostfoundRouter.patch('/:id/status', authenticate, (req, res) => {
  const item = db.lostFound.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (req.body.status) item.status = req.body.status;
  res.json({ item });
});

lostfoundRouter.post('/:id/report', authenticate, (_req, res) => {
  res.json({ message: 'Report received.' });
});

lostfoundRouter.delete('/:id', authenticate, (req, res) => {
  db.lostFound = db.lostFound.filter((i) => i.id !== req.params.id);
  res.json({ message: 'Item deleted' });
});

export default lostfoundRouter;
