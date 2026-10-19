import { Router } from 'express';
import { db } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const leaderboardRouter = Router();

function rankedList() {
  return [...db.leaderboard].sort((a, b) => b.cgpa - a.cgpa).map((entry, index) => {
    entry.rank = index + 1;
    return entry;
  });
}

leaderboardRouter.get('/', (req, res) => {
  const { milestone } = req.query;
  let list = rankedList();
  if (milestone && milestone !== 'ALL') {
    list = list.filter((i) => i.milestone === milestone);
  }
  res.json({ entries: list, leaderboard: list });
});

leaderboardRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  rankedList();
  const entry = db.leaderboard.find((l) => l.userId === userId);
  res.json({
    status: {
      isOptedIn: !!entry,
      isAnonymous: entry?.isAnonymous || false,
      currentRank: entry?.rank,
      cgpa: entry?.cgpa,
      milestone: entry?.milestone || 'Sem 1-4',
    },
    entry: entry || null,
  });
});

function upsertOptIn(req: AuthenticatedRequest, isOptedIn: boolean, isAnonymous: boolean) {
  const userId = req.user!.id;
  let entry = db.leaderboard.find((l) => l.userId === userId);

  if (isOptedIn && !entry) {
    entry = {
      id: 'lb-' + Date.now(),
      userId,
      rank: db.leaderboard.length + 1,
      displayName: req.user?.name || 'Student',
      alias: 'Student#' + Math.floor(100 + Math.random() * 900),
      isAnonymous: !!isAnonymous,
      cgpa: 8.5,
      milestone: 'Sem 1-4',
      department: req.user?.department || 'Computer Science',
      batch: req.user?.batch || '2023-2027',
      verified: false,
    };
    db.leaderboard.push(entry);
  } else if (!isOptedIn && entry) {
    db.leaderboard = db.leaderboard.filter((l) => l.userId !== userId);
    entry = undefined;
  } else if (entry) {
    entry.isAnonymous = !!isAnonymous;
    if (req.user?.name) entry.displayName = req.user.name;
  }

  rankedList();
  const current = db.leaderboard.find((l) => l.userId === userId);
  return {
    isOptedIn: !!current,
    isAnonymous: current?.isAnonymous || false,
    currentRank: current?.rank,
    cgpa: current?.cgpa,
    milestone: current?.milestone || 'Sem 1-4',
  };
}

leaderboardRouter.post('/opt-in', authenticate, (req: AuthenticatedRequest, res) => {
  const { isOptedIn, isAnonymous } = req.body;
  const status = upsertOptIn(req, !!isOptedIn, !!isAnonymous);
  res.json({ status });
});

leaderboardRouter.post('/publish', authenticate, (req: AuthenticatedRequest, res) => {
  const isAnonymous = req.body.displayMode === 'ANONYMOUS' || req.body.isAnonymous;
  const status = upsertOptIn(req, true, !!isAnonymous);
  const entry = db.leaderboard.find((l) => l.userId === req.user!.id);
  res.json({ entry, status });
});

leaderboardRouter.patch('/publish', authenticate, (req: AuthenticatedRequest, res) => {
  const existing = db.leaderboard.find((l) => l.userId === req.user!.id);
  const isAnonymous =
    req.body.displayMode === 'ANONYMOUS' ||
    req.body.isAnonymous === true ||
    (req.body.displayMode !== 'NAMED' && existing?.isAnonymous);
  const optedIn = req.body.consentGiven === false ? false : true;
  const status = upsertOptIn(req, optedIn, !!isAnonymous);
  const entry = db.leaderboard.find((l) => l.userId === req.user!.id) || null;
  res.json({ entry, status });
});

leaderboardRouter.delete('/publish', authenticate, (req: AuthenticatedRequest, res) => {
  const status = upsertOptIn(req, false, false);
  res.json({ status, message: 'You have been removed from the leaderboard.' });
});

leaderboardRouter.patch('/:id/verify', authenticate, (req, res) => {
  const entry = db.leaderboard.find((l) => l.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Leaderboard entry not found' });
  entry.verified = req.body.verified !== false;
  res.json({ entry });
});

export default leaderboardRouter;
