import { Router } from 'express';
import { db } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const list = db.notifications.filter((n) => n.userId === userId || n.userId === 'all');
  res.json({ notifications: list });
});

notificationRouter.get('/unread-count', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const count = db.notifications.filter(
    (n) => (n.userId === userId || n.userId === 'all') && !n.read
  ).length;
  res.json({ count });
});

notificationRouter.patch('/read-all', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  db.notifications.forEach((n) => {
    if (n.userId === userId || n.userId === 'all') n.read = true;
  });
  res.json({ success: true });
});

notificationRouter.patch('/:id/read', authenticate, (req, res) => {
  const n = db.notifications.find((item) => item.id === req.params.id);
  if (n) n.read = true;
  res.json({ success: true });
});

export default notificationRouter;
