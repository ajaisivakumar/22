import prisma from '../config/database';
import { LostFoundItem, LostFoundStatus } from '@prisma/client';

export class LostFoundRepository {
  public static async createItem(data: {
    creatorId?: string;
    itemName?: string;
    category?: string;
    imageUrl: string;
    imageKey: string;
    foundLocation?: string;
    currentLocation?: string;
    description?: string;
    itemStatus?: LostFoundStatus;
  }): Promise<LostFoundItem> {
    return prisma.lostFoundItem.create({
      data: {
        creatorId: data.creatorId || null,
        itemName: data.itemName || null,
        category: data.category || null,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        foundLocation: data.foundLocation || null,
        currentLocation: data.currentLocation || null,
        description: data.description || null,
        itemStatus: data.itemStatus || 'FOUND',
        publicationStatus: 'PUBLISHED',
      },
    });
  }

  public static async getItems(status?: LostFoundStatus, search?: string) {
    const where: any = { isHidden: false, publicationStatus: 'PUBLISHED' };
    if (status) where.itemStatus = status;
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { foundLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.lostFoundItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });
  }

  public static async getItemById(id: string) {
    return prisma.lostFoundItem.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true, email: true },
        },
      },
    });
  }

  public static async updateItem(id: string, data: Partial<LostFoundItem>) {
    return prisma.lostFoundItem.update({
      where: { id },
      data,
    });
  }

  public static async deleteItem(id: string) {
    return prisma.lostFoundItem.delete({ where: { id } });
  }

  public static async reportItem(reporterId: string, itemId: string, reason: string) {
    return prisma.report.create({
      data: {
        reporterId,
        entityType: 'LOST_FOUND',
        entityId: itemId,
        reason,
      },
    });
  }
}
