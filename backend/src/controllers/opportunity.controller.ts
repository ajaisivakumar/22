import { Request, Response, NextFunction } from 'express';
import { OpportunityRepository } from '../repositories/opportunity.repository';
import AuditService from '../audit/audit.service';

export class OpportunityController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, category } = req.query as { status?: any; category?: string };
      const opportunities = await OpportunityRepository.getOpportunities(status, category);
      res.status(200).json({ success: true, data: opportunities });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const opportunity = await OpportunityRepository.getOpportunityById(id);

      if (!opportunity) {
        res.status(404).json({ success: false, message: 'Opportunity not found' });
        return;
      }

      res.status(200).json({ success: true, data: opportunity });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const anonymousAlias = req.user!.anonymousAlias || `Student_${Math.random().toString(36).substring(2, 7)}`;
      const opportunity = await OpportunityRepository.createOpportunity(userId, anonymousAlias, req.body);

      await AuditService.log({
        eventType: 'OPPORTUNITY_CREATED',
        actorId: userId,
        targetType: 'OPPORTUNITY',
        targetId: opportunity.id,
        outcome: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        data: opportunity,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const existing = await OpportunityRepository.getOpportunityById(id);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Opportunity not found' });
        return;
      }

      if (existing.creatorId !== userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to modify this opportunity' });
        return;
      }

      const updated = await OpportunityRepository.updateOpportunity(id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const existing = await OpportunityRepository.getOpportunityById(id);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Opportunity not found' });
        return;
      }

      if (existing.creatorId !== userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to delete this opportunity' });
        return;
      }

      await OpportunityRepository.deleteOpportunity(id);
      res.status(200).json({ success: true, message: 'Opportunity deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async expressInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: opportunityId } = req.params;
      const applicantId = req.user!.id;

      const opportunity = await OpportunityRepository.getOpportunityById(opportunityId);
      if (!opportunity) {
        res.status(404).json({ success: false, message: 'Opportunity not found' });
        return;
      }

      if (opportunity.creatorId === applicantId) {
        res.status(400).json({ success: false, message: 'You cannot message your own opportunity post' });
        return;
      }

      // Check if conversation already exists between applicant and creator
      let conversation = await OpportunityRepository.findConversationByOpportunityAndUser(opportunityId, applicantId);
      if (!conversation) {
        conversation = await OpportunityRepository.createConversation(opportunityId, [applicantId, opportunity.creatorId]);
      }

      res.status(200).json({
        success: true,
        message: 'Interest recorded. Conversation initiated.',
        data: { conversationId: conversation.id },
      });
    } catch (err) {
      next(err);
    }
  }
}
