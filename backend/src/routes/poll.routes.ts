import { Router } from 'express';
import { db, PollRecord } from '../db/store';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

export const pollRouter = Router();

pollRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { status } = req.query;
  const currentUserId = req.user?.id;
  let list = db.polls;
  if (status) {
    list = list.filter((p) => p.status === status);
  }
  const enriched = list.map((p) => ({
    ...p,
    userVoteId: currentUserId ? p.userVotes?.[currentUserId] : undefined,
  }));
  res.json({ polls: enriched });
});

pollRouter.get('/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const poll = db.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });
  res.json({
    poll: {
      ...poll,
      userVoteId: req.user?.id ? poll.userVotes?.[req.user.id] : undefined,
    },
  });
});

pollRouter.post('/:id/vote', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { optionId } = req.body;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Please sign in to vote.' });

  const poll = db.polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });
  if (poll.status !== 'ACTIVE') return res.status(400).json({ message: 'This poll is closed.' });
  if (new Date(poll.expiresAt) < new Date()) {
    return res.status(400).json({ message: 'Voting has closed for this poll.' });
  }

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return res.status(400).json({ message: 'Invalid poll option.' });

  if (!poll.userVotes) poll.userVotes = {};
  const previous = poll.userVotes[userId];
  if (previous === optionId) {
    return res.json({ poll: { ...poll, userVoteId: optionId } });
  }
  if (previous) {
    const prevOpt = poll.options.find((o) => o.id === previous);
    if (prevOpt && prevOpt.voteCount > 0) prevOpt.voteCount -= 1;
  } else {
    poll.totalVotes += 1;
  }
  poll.userVotes[userId] = optionId;
  option.voteCount += 1;

  res.json({ poll: { ...poll, userVoteId: optionId } });
});

pollRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MODERATOR') {
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
