import { Router } from 'express';
import { db, SavedCGPARecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const cgpaRouter = Router();

cgpaRouter.get('/saved', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || 'usr-1';
  const list = db.savedCgpa.filter((r) => r.userId === userId);
  res.json({ results: list });
});

cgpaRouter.post('/saved', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || 'usr-1';
  const { semesterNumber, courses, gpa, totalCredits } = req.body;

  const existingIdx = db.savedCgpa.findIndex(
    (r) => r.userId === userId && r.semesterNumber === Number(semesterNumber)
  );

  const record: SavedCGPARecord = {
    id: 'sem-' + semesterNumber,
    userId,
    semesterNumber: Number(semesterNumber),
    gpa: Number(gpa),
    totalCredits: Number(totalCredits),
    courses: courses || [],
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    db.savedCgpa[existingIdx] = record;
  } else {
    db.savedCgpa.push(record);
    db.savedCgpa.sort((a, b) => a.semesterNumber - b.semesterNumber);
  }

  res.status(201).json({ result: record });
});

cgpaRouter.delete('/saved/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || 'usr-1';
  db.savedCgpa = db.savedCgpa.filter((r) => !(r.id === req.params.id && r.userId === userId));
  res.json({ message: 'Deleted' });
});

export default cgpaRouter;
