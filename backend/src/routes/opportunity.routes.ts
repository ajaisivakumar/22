import { Router } from 'express';
import { db, OpportunityRecord, MessageRecord } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const opportunityRouter = Router();

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
  const newOpp: OpportunityRecord = {
    id: 'opp-' + Date.now(),
    title,
    description,
    category: category || 'HACKATHON',
    requiredSkills: requiredSkills || [],
    teamSize: Number(teamSize) || 4,
    contactPreference: contactPreference || 'in_app',
    creatorAlias: 'Builder#' + Math.floor(100 + Math.random() * 900),
    creatorId: req.user?.id,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  db.opportunities.unshift(newOpp);
  res.status(201).json({ opportunity: newOpp });
});

opportunityRouter.get('/:id/messages', authenticate, (req, res) => {
  const list = db.messages.filter((m) => m.opportunityId === req.params.id);
  res.json({ messages: list });
});

opportunityRouter.post('/:id/messages', authenticate, (req: AuthenticatedRequest, res) => {
  const { message } = req.body;
  const opp = db.opportunities.find((o) => o.id === req.params.id);
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

  const newMsg: MessageRecord = {
    id: 'msg-' + Date.now(),
    opportunityId: opp.id,
    senderId: req.user?.id || 'usr-1',
    senderName: req.user?.name || 'Student',
    senderAlias: req.user ? req.user.name : 'You',
    recipientId: opp.creatorAlias,
    message,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(newMsg);
  res.status(201).json({ message: newMsg });
});

opportunityRouter.patch('/:id/close', authenticate, (req, res) => {
  const opp = db.opportunities.find((o) => o.id === req.params.id);
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
  opp.status = 'CLOSED';
  res.json({ opportunity: opp });
});

export default opportunityRouter;
