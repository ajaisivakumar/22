import { Router } from 'express';
import { db, toPublicUser } from '../db/store';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/metrics', (_req, res) => {
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
      moderationActions24h: db.auditLogs.filter(
        (l) => Date.now() - new Date(l.createdAt).getTime() < 86400000
      ).length,
      securityEventsCount: 0,
    },
  });
});

adminRouter.get('/users', (req, res) => {
  const { role, status, search } = req.query;
  let list = db.users;
  if (role) list = list.filter((u) => u.role === role);
  if (status) list = list.filter((u) => u.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  res.json({ users: list.map(toPublicUser) });
});

adminRouter.patch('/users/:id/status', (req: AuthenticatedRequest, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = req.body.status;
  res.json({ user: toPublicUser(user) });
});

adminRouter.patch('/users/:id/role', (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = req.body.role;
  res.json({ user: toPublicUser(user) });
});

adminRouter.get('/events', (_req, res) => {
  res.json({ events: db.events });
});

adminRouter.post('/events/:id/approve', (req, res) => {
  const evt = db.events.find((e) => e.id === req.params.id);
  if (!evt) return res.status(404).json({ message: 'Event not found' });
  evt.status = 'PUBLISHED';
  res.json({ event: evt });
});

adminRouter.post('/events/:id/reject', (req, res) => {
  const evt = db.events.find((e) => e.id === req.params.id);
  if (!evt) return res.status(404).json({ message: 'Event not found' });
  evt.status = 'REJECTED';
  if (req.body.reason) evt.moderatorNotes = req.body.reason;
  res.json({ event: evt });
});

adminRouter.get('/lab-complaints', (req, res) => {
  const { status, lab } = req.query;
  let list = db.complaints;
  if (status) list = list.filter((c) => c.status === status);
  if (lab) list = list.filter((c) => c.lab === lab);
  res.json({ complaints: list });
});

adminRouter.patch('/lab-complaints/:id/status', (req, res) => {
  const cmp = db.complaints.find((c) => c.id === req.params.id);
  if (!cmp) return res.status(404).json({ message: 'Complaint not found' });
  if (req.body.status) cmp.status = req.body.status;
  const note = req.body.notes || req.body.resolutionNote || req.body.adminNotes;
  if (note) cmp.adminNotes = note;
  if (req.body.status === 'RESOLVED') cmp.resolvedAt = new Date().toISOString();
  res.json({ complaint: cmp });
});

adminRouter.get('/lost-and-found', (_req, res) => {
  res.json({ items: db.lostFound });
});

adminRouter.patch('/lost-and-found/:id/hide', (req, res) => {
  const item = db.lostFound.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  item.status = 'HIDDEN';
  res.json({ item });
});

adminRouter.patch('/leaderboard/:id/verify', (req, res) => {
  const entry = db.leaderboard.find((l) => l.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Entry not found' });
  entry.verified = req.body.verified !== false;
  res.json({ entry });
});

adminRouter.get('/audit-logs', (_req, res) => {
  res.json({ logs: db.auditLogs });
});

export default adminRouter;
