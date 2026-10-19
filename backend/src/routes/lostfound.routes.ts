import { Router } from 'express';
import { db, LostFoundRecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const lostfoundRouter = Router();

lostfoundRouter.get('/', (req, res) => {
  const { type, status } = req.query;
  let list = db.lostFound;
  if (type) list = list.filter((i) => i.type === type);
  if (status) list = list.filter((i) => i.status === status);
  res.json({ items: list });
});

lostfoundRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { title, type, category, location, date, description, imageUrl, contactInfo, isSensitive } = req.body;
  const newItem: LostFoundRecord = {
    id: 'lf-' + Date.now(),
    title,
    type: type || 'FOUND',
    category: category || 'Other',
    location,
    date,
    description,
    imageUrl,
    contactInfo,
    isSensitive: !!isSensitive,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  db.lostFound.unshift(newItem);
  res.status(201).json({ item: newItem });
});

lostfoundRouter.patch('/:id/status', authenticate, (req, res) => {
  const item = db.lostFound.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (req.body.status) item.status = req.body.status;
  res.json({ item });
});

lostfoundRouter.delete('/:id', authenticate, (req, res) => {
  db.lostFound = db.lostFound.filter((i) => i.id !== req.params.id);
  res.json({ message: 'Item deleted' });
});

export default lostfoundRouter;
