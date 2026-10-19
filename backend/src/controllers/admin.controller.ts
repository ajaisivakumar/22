import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { UserRepository } from '../repositories/user.repository';
import AuditService from '../audit/audit.service';

export class AdminController {
  public static async dashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        totalEvents,
        pendingEvents,
        totalOpportunities,
        totalComplaints,
        openComplaints,
        totalPolls,
        totalLostFound,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.event.count({ where: { status: 'PENDING' } }),
        prisma.opportunity.count(),
        prisma.labComplaint.count(),
        prisma.labComplaint.count({ where: { status: 'OPEN' } }),
        prisma.poll.count(),
        prisma.lostFoundItem.count(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalEvents,
          pendingEvents,
          totalOpportunities,
          totalComplaints,
          openComplaints,
          totalPolls,
          totalLostFound,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;
      const { total, users } = await UserRepository.getAllUsers(skip, limit, search);

      res.status(200).json({
        success: true,
        data: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          users,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { accountStatus } = req.body;

      const updated = await UserRepository.updateUser(id, { accountStatus });

      await AuditService.log({
        eventType: 'ADMIN_USER_STATUS_CHANGE',
        actorId: req.user!.id,
        actorRole: req.user!.role,
        targetType: 'USER',
        targetId: id,
        outcome: 'SUCCESS',
        description: `Status changed to ${accountStatus}`,
      });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const updated = await UserRepository.updateUser(id, { role });

      await AuditService.log({
        eventType: 'ADMIN_USER_ROLE_CHANGE',
        actorId: req.user!.id,
        actorRole: req.user!.role,
        targetType: 'USER',
        targetId: id,
        outcome: 'SUCCESS',
        description: `Role changed to ${role}`,
      });

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const eventType = req.query.eventType as string;

      const data = await AuditService.getLogs(page, limit, { eventType });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
