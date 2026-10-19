import { Router } from 'express';
import { db, OpportunityRecord, MessageRecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const opportunityRouter = Router();

function parseSkills(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

opportunityRouter.get('/', (req, res) => {
  const { category } = req.query;
  let list = db.opportunities;
  if (category && category !== 'ALL') {
    list = list.filter((o) => o.category === category);
  }
  res.json({ opportunities: list });
});

opportunityRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { title, description, category, requiredSkills, teamSize, contactPreference } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }
  const newOpp: OpportunityRecord = {
    id: 'opp-' + Date.now(),
    title,
    description,
    category: category || 'HACKATHON',
    requiredSkills: parseSkills(requiredSkills),
    teamSize: Number(teamSize) || 4,
    contactPreference: contactPreference || 'in_app',
    creatorAlias: 'Builder#' + Math.floor(100 + Math.random() * 900),
    creatorId: req.user?.id,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  db.opportunities.unshift(newOpp);
  res.status(201).json({ opportunity: { ...newOpp, isOwner: true } });
});

opportunityRouter.get('/:id/messages', authenticate, (req, res) => {
  const list = db.messages.filter((m) => m.opportunityId === req.params.id);
  res.json({ messages: list });
});

opportunityRouter.post('/:id/messages', authenticate, (req: AuthenticatedRequest, res) => {
  const { message } = req.body;
  const opp = db.opportunities.find((o) => o.id === req.params.id);
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  const newMsg: MessageRecord = {
    id: 'msg-' + Date.now(),
    opportunityId: opp.id,
    senderId: req.user?.id || 'unknown',
    senderName: req.user?.name || 'Student',
    senderAlias: req.user?.name || 'You',
    recipientId: opp.creatorId || opp.creatorAlias,
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  };

  db.messages.push(newMsg);
  res.status(201).json({ chatMessage: newMsg, message: newMsg });
});

opportunityRouter.patch('/:id/close', authenticate, (req, res) => {
  const opp = db.opportunities.find((o) => o.id === req.params.id);
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
  opp.status = 'CLOSED';
  res.json({ opportunity: opp });
});

export default opportunityRouter;
