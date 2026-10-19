import prisma from '../config/database';
import logger from '../config/logger';

export interface CreateAuditLogParams {
  eventType: string;
  actorId?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'PENDING';
  description?: string;
  requestId?: string;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          eventType: params.eventType,
          actorId: params.actorId || null,
          actorRole: params.actorRole || null,
          targetType: params.targetType || null,
          targetId: params.targetId || null,
          outcome: params.outcome,
          description: params.description || null,
          requestId: params.requestId || null,
        },
      });
    } catch (err) {
      logger.error('Failed to persist audit log: %o', err);
    }
  }

  public static async getLogs(page = 1, limit = 50, filter?: { eventType?: string; actorId?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filter?.eventType) where.eventType = filter.eventType;
    if (filter?.actorId) where.actorId = filter.actorId;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }
}

export default AuditService;
