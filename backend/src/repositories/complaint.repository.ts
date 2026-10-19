import prisma from '../config/database';
import { ComplaintStatus, NotificationDeliveryStatus, LabComplaint } from '@prisma/client';
import { generateComplaintRefId } from '../utils/crypto';

export class ComplaintRepository {
  public static async createComplaint(data: {
    floor: string;
    lab: string;
    systemNumber: string;
    description: string;
  }): Promise<LabComplaint> {
    // Determine daily sequence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const countToday = await prisma.labComplaint.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const referenceId = generateComplaintRefId(countToday + 1);

    return prisma.labComplaint.create({
      data: {
        referenceId,
        floor: data.floor,
        lab: data.lab,
        systemNumber: data.systemNumber,
        description: data.description,
        status: 'OPEN',
      },
    });
  }

  public static async getAllComplaints(status?: ComplaintStatus) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.labComplaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        moderator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  public static async getComplaintById(id: string) {
    return prisma.labComplaint.findUnique({
      where: { id },
      include: {
        moderator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  public static async updateStatus(
    id: string,
    moderatorId: string,
    status: ComplaintStatus,
    resolutionNote?: string
  ) {
    return prisma.labComplaint.update({
      where: { id },
      data: {
        status,
        moderatorId,
        resolutionNote: resolutionNote || null,
      },
    });
  }

  public static async updateDeliveryStatus(
    id: string,
    updates: {
      telegramStatus?: NotificationDeliveryStatus;
      emailStatus?: NotificationDeliveryStatus;
      telegramAttempts?: number;
      emailAttempts?: number;
      lastTelegramError?: string | null;
      lastEmailError?: string | null;
    }
  ) {
    return prisma.labComplaint.update({
      where: { id },
      data: updates,
    });
  }
}
