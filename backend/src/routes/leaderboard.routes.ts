import { Router } from 'express';
import { db } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', (req, res) => {
  const { milestone } = req.query;
  let list = db.leaderboard;
  if (milestone && milestone !== 'ALL') {
    list = list.filter((i) => i.milestone === milestone);
  }
  res.json({ leaderboard: list });
});

leaderboardRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || 'usr-1';
  const entry = db.leaderboard.find((l) => l.userId === userId);
  res.json({
    status: {
      isOptedIn: !!entry,
      isAnonymous: entry?.isAnonymous || false,
      currentRank: entry?.rank || 6,
      cgpa: entry?.cgpa || 8.8,
      milestone: entry?.milestone || 'Sem 1-4',
    },
  });
});

leaderboardRouter.post('/opt-in', authenticate, (req: AuthenticatedRequest, res) => {
  const { isOptedIn, isAnonymous } = req.body;
  const userId = req.user?.id || 'usr-1';
  let entry = db.leaderboard.find((l) => l.userId === userId);

  if (isOptedIn && !entry) {
    entry = {
      id: 'lb-' + Date.now(),
      userId,
      rank: db.leaderboard.length + 1,
      displayName: req.user?.name || 'Alex Johnson',
      alias: 'Student#' + Math.floor(100 + Math.random() * 900),
      isAnonymous: !!isAnonymous,
      cgpa: 8.8,
      milestone: 'Sem 1-4',
      department: req.user?.department || 'Computer Science',
      batch: '2023-2027',
      verified: true,
    };
    db.leaderboard.push(entry);
  } else if (!isOptedIn && entry) {
    db.leaderboard = db.leaderboard.filter((l) => l.userId !== userId);
  } else if (entry) {
    entry.isAnonymous = !!isAnonymous;
  }

  res.json({
    status: {
      isOptedIn,
      isAnonymous: !!isAnonymous,
      currentRank: entry?.rank || 6,
      cgpa: 8.8,
      milestone: 'Sem 1-4',
    },
  });
});

leaderboardRouter.patch('/:id/verify', authenticate, (req, res) => {
  const entry = db.leaderboard.find((l) => l.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Leaderboard entry not found' });
  entry.verified = req.body.verified;
  res.json({ entry });
});

export default leaderboardRouter;
