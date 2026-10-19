import { Request, Response, NextFunction } from 'express';
import { ComplaintRepository } from '../repositories/complaint.repository';
import telegramService from '../services/telegram.service';
import emailService from '../services/email.service';
import AuditService from '../audit/audit.service';
import logger from '../config/logger';

export class ComplaintController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { floor, lab, systemNumber, description } = req.body;

      const complaint = await ComplaintRepository.createComplaint({
        floor,
        lab,
        systemNumber,
        description,
      });

      // Dispatch Telegram notification
      telegramService
        .sendLabComplaintNotification({
          referenceId: complaint.referenceId,
          floor: complaint.floor,
          lab: complaint.lab,
          systemNumber: complaint.systemNumber,
          description: complaint.description,
          createdAt: complaint.createdAt,
        })
        .then(async (result) => {
          await ComplaintRepository.updateDeliveryStatus(complaint.id, {
            telegramStatus: result.success ? 'SENT' : 'FAILED',
            telegramAttempts: 1,
            lastTelegramError: result.error || null,
          });
        })
        .catch((err) => {
          logger.error('Background telegram sending error: %o', err);
        });

      // Dispatch Email notification
      emailService
        .sendLabComplaintEmail({
          referenceId: complaint.referenceId,
          floor: complaint.floor,
          lab: complaint.lab,
          systemNumber: complaint.systemNumber,
          description: complaint.description,
          createdAt: complaint.createdAt,
        })
        .then(async (success) => {
          await ComplaintRepository.updateDeliveryStatus(complaint.id, {
            emailStatus: success ? 'SENT' : 'FAILED',
            emailAttempts: 1,
          });
        })
        .catch((err) => {
          logger.error('Background email sending error: %o', err);
        });

      await AuditService.log({
        eventType: 'LAB_COMPLAINT_SUBMITTED',
        targetType: 'LAB_COMPLAINT',
        targetId: complaint.id,
        outcome: 'SUCCESS',
        description: `Reference: ${complaint.referenceId}`,
      });

      res.status(201).json({
        success: true,
        message: 'Lab complaint submitted anonymously. Lab technician has been notified.',
        data: {
          referenceId: complaint.referenceId,
          status: complaint.status,
          createdAt: complaint.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin
  public static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query as { status?: any };
      const complaints = await ComplaintRepository.getAllComplaints(status);
      res.status(200).json({ success: true, data: complaints });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resolutionNote } = req.body;
      const moderatorId = req.user!.id;

      const complaint = await ComplaintRepository.updateStatus(id, moderatorId, status, resolutionNote);

      await AuditService.log({
        eventType: 'LAB_COMPLAINT_UPDATED',
        actorId: moderatorId,
        actorRole: req.user!.role,
        targetType: 'LAB_COMPLAINT',
        targetId: id,
        outcome: 'SUCCESS',
        description: `Status changed to ${status}`,
      });

      res.status(200).json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
}
