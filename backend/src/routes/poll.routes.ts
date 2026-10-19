import { Router } from 'express';
import { db, PollRecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const pollRouter = Router();

pollRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { status } = req.query;
  const currentUserId = req.user?.id || 'usr-1';

  let list = db.polls;
  if (status) {
    list = list.filter((p) => p.status === status);
  }

  // Attach userVoteId for client
  const enriched = list.map((p) => ({
    ...p,
    userVoteId: p.userVotes?.[currentUserId],
  }));

  res.json({ polls: enriched });
});

pollRouter.post('/:id/vote', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { optionId } = req.body;
  const userId = req.user?.id || 'usr-1';

  const poll = db.polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });

  if (!poll.userVotes) poll.userVotes = {};
  poll.userVotes[userId] = optionId;
  poll.totalVotes += 1;

  const opt = poll.options.find((o) => o.id === optionId);
  if (opt) opt.voteCount += 1;

  res.json({ poll: { ...poll, userVoteId: optionId } });
});

pollRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  // Only ADMIN can create polls
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only administrators can create polls.' });
  }

  const { question, description, options, expiresAt } = req.body;
  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: 'Poll question and at least 2 options are required' });
  }

  const newPoll: PollRecord = {
    id: 'poll-' + Date.now(),
    question,
    description,
    options: options.map((t: string, idx: number) => ({
      id: `opt-${Date.now()}-${idx}`,
      text: t,
      voteCount: 0,
    })),
    totalVotes: 0,
    userVotes: {},
    status: 'ACTIVE',
    createdBy: req.user.id,
    expiresAt: expiresAt || new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.polls.unshift(newPoll);
  res.status(201).json({ poll: newPoll });
});

pollRouter.patch('/:id/close', authenticate, (req, res) => {
  const poll = db.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });
  poll.status = 'CLOSED';
  res.json({ poll });
});

pollRouter.delete('/:id', authenticate, (req, res) => {
  db.polls = db.polls.filter((p) => p.id !== req.params.id);
  res.json({ message: 'Poll deleted' });
});

export default pollRouter;
