import { Request, Response, NextFunction } from 'express';
import { EventRepository } from '../repositories/event.repository';
import AuditService from '../audit/audit.service';

export class EventController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search } = req.query as { category?: string; search?: string };
      const events = await EventRepository.getPublishedEvents(category, search);
      res.status(200).json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await EventRepository.getEventById(id);

      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      res.status(200).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const event = await EventRepository.createEvent(userId, req.body);

      await AuditService.log({
        eventType: 'EVENT_SUBMITTED',
        actorId: userId,
        targetType: 'EVENT',
        targetId: event.id,
        outcome: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        message: 'Event submitted successfully. Awaiting moderator approval.',
        data: event,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const existing = await EventRepository.getEventById(id);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      if (existing.creatorId !== userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
        return;
      }

      const updated = await EventRepository.updateEvent(id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const existing = await EventRepository.getEventById(id);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      if (existing.creatorId !== userId && req.user!.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
        return;
      }

      await EventRepository.deleteEvent(id);
      res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async report(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const reporterId = req.user!.id;

      await EventRepository.reportEvent(reporterId, id, reason);
      res.status(200).json({ success: true, message: 'Event reported for moderator review' });
    } catch (err) {
      next(err);
    }
  }

  // Admin
  public static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query as { status?: any };
      const events = await EventRepository.getAllEventsAdmin(status);
      res.status(200).json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  }

  public static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const moderatorId = req.user!.id;
      const event = await EventRepository.moderateEvent(id, moderatorId, 'PUBLISHED');
      res.status(200).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  public static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const moderatorId = req.user!.id;
      const event = await EventRepository.moderateEvent(id, moderatorId, 'REJECTED', note);
      res.status(200).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }
}
