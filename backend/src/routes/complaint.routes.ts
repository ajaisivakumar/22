import { Router } from 'express';
import { db, ComplaintRecord } from '../db/store';
import { authenticate } from '../middleware/auth.middleware';

export const complaintRouter = Router();

complaintRouter.get('/', (_req, res) => {
  const { status } = _req.query;
  let list = db.complaints;
  if (status) list = list.filter((c) => c.status === status);
  res.json({ complaints: list });
});

complaintRouter.get('/my', (_req, res) => {
  res.json({ complaints: db.complaints });
});

complaintRouter.post('/', (req, res) => {
  const { floor, lab, systemNumber, description } = req.body;
  if (!lab || !systemNumber || !description) {
    return res.status(400).json({ message: 'Lab, system number, and description are required' });
  }

  const ref = 'LAB-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const newComplaint: ComplaintRecord = {
    id: 'cmp-' + Date.now(),
    referenceId: ref,
    floor: floor || 'Ground Floor',
    lab,
    systemNumber,
    description,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  db.complaints.unshift(newComplaint);
  res.status(201).json({ complaint: newComplaint, referenceId: newComplaint.referenceId });
});

complaintRouter.patch('/:id/status', authenticate, (req, res) => {
  const { status, notes, resolutionNote, adminNotes } = req.body;
  const cmp = db.complaints.find((c) => c.id === req.params.id);
  if (!cmp) return res.status(404).json({ message: 'Complaint not found' });
  if (status) cmp.status = status;
  const note = notes || resolutionNote || adminNotes;
  if (note) cmp.adminNotes = note;
  if (status === 'RESOLVED') cmp.resolvedAt = new Date().toISOString();
  res.json({ complaint: cmp });
});

export default complaintRouter;
