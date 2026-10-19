import prisma from '../config/database';
import { EventStatus, Event } from '@prisma/client';

export class EventRepository {
  public static async createEvent(creatorId: string, data: any): Promise<Event> {
    return prisma.event.create({
      data: {
        creatorId,
        title: data.title,
        category: data.category,
        description: data.description,
        brochureUrl: data.brochureUrl || null,
        brochureKey: data.brochureKey || null,
        registrationUrl: data.registrationUrl || null,
        eventStartDate: data.eventStartDate ? new Date(data.eventStartDate) : null,
        eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : null,
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
        organizer: data.organizer || null,
        location: data.location || null,
        format: data.format || 'OFFLINE',
        status: 'PENDING',
      },
    });
  }

  public static async getPublishedEvents(category?: string, search?: string) {
    const where: any = { status: 'PUBLISHED' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { organizer: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.event.findMany({
      where,
      orderBy: { eventStartDate: 'asc' },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });
  }

  public static async getEventById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true, email: true },
        },
      },
    });
  }

  public static async updateEvent(id: string, data: Partial<Event>) {
    return prisma.event.update({
      where: { id },
      data,
    });
  }

  public static async deleteEvent(id: string) {
    return prisma.event.delete({ where: { id } });
  }

  public static async reportEvent(reporterId: string, eventId: string, reason: string) {
    return prisma.report.create({
      data: {
        reporterId,
        entityType: 'EVENT',
        entityId: eventId,
        reason,
      },
    });
  }

  public static async getAllEventsAdmin(status?: EventStatus) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        reports: true,
      },
    });
  }

  public static async moderateEvent(id: string, moderatorId: string, status: EventStatus, moderatorNote?: string) {
    return prisma.event.update({
      where: { id },
      data: {
        status,
        moderatorId,
        moderatorNote: moderatorNote || null,
      },
    });
  }
}
