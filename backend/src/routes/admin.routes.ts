import { Router } from 'express';
import { db } from '../db/store';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get('/metrics', (req, res) => {
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedUsers = db.users.filter((u) => u.status === 'SUSPENDED').length;
  const publishedEvents = db.events.filter((e) => e.status === 'PUBLISHED').length;
  const activePolls = db.polls.filter((p) => p.status === 'ACTIVE').length;
  const openComplaints = db.complaints.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
  const lostFoundOpen = db.lostFound.filter((l) => l.status === 'OPEN').length;
  const lostFoundResolved = db.lostFound.filter((l) => l.status === 'RESOLVED' || l.status === 'RETURNED').length;

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      publishedEvents,
      activePolls,
      openComplaints,
      lostFoundOpen,
      lostFoundResolved,
      moderationActions24h: 12,
      securityEventsCount: 0,
    },
  });
});

adminRouter.get('/users', (req, res) => {
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json({ users: safeUsers });
});

adminRouter.patch('/users/:id/status', (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = req.body.status;
  const { password, ...safeUser } = user;
  res.json({ user: safeUser });
});

adminRouter.patch('/users/:id/role', (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = req.body.role;
  const { password, ...safeUser } = user;
  res.json({ user: safeUser });
});

adminRouter.get('/audit-logs', (req, res) => {
  res.json({ logs: db.auditLogs });
});

export default adminRouter;
