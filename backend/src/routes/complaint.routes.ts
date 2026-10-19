import { Router } from 'express';
import { db, ComplaintRecord } from '../db/store';
import { authenticate } from '../middleware/auth.middleware';

export const complaintRouter = Router();

complaintRouter.get('/', (req, res) => {
  const { status } = req.query;
  let list = db.complaints;
  if (status) list = list.filter((c) => c.status === status);
  res.json({ complaints: list });
});

complaintRouter.post('/', (req, res) => {
  const { floor, lab, systemNumber, description } = req.body;
  if (!floor || !lab || !systemNumber || !description) {
    return res.status(400).json({ message: 'All complaint fields are required' });
  }

  const ref = 'LAB-2026-' + Math.floor(1000 + Math.random() * 9000);
  const newComplaint: ComplaintRecord = {
    id: 'cmp-' + Date.now(),
    referenceId: ref,
    floor,
    lab,
    systemNumber,
    description,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  db.complaints.unshift(newComplaint);
  res.status(201).json({ complaint: newComplaint });
});

complaintRouter.patch('/:id/status', authenticate, (req, res) => {
  const { status, notes } = req.body;
  const cmp = db.complaints.find((c) => c.id === req.params.id);
  if (!cmp) return res.status(404).json({ message: 'Complaint not found' });
  if (status) cmp.status = status;
  if (notes) cmp.adminNotes = notes;
  if (status === 'RESOLVED') cmp.resolvedAt = new Date().toISOString();
  res.json({ complaint: cmp });
});

export default complaintRouter;
