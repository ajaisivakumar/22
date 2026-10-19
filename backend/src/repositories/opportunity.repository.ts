import prisma from '../config/database';
import { Opportunity, OpportunityStatus } from '@prisma/client';

export class OpportunityRepository {
  public static async createOpportunity(creatorId: string, alias: string, data: any): Promise<Opportunity> {
    return prisma.opportunity.create({
      data: {
        creatorId,
        anonymousAlias: alias,
        title: data.title,
        category: data.category,
        description: data.description,
        skillsNeeded: data.skillsNeeded || null,
        teamSize: data.teamSize || null,
        collaborationMode: data.collaborationMode || null,
        eventName: data.eventName || null,
        externalUrl: data.externalUrl || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        additionalInfo: data.additionalInfo || null,
        lookingFor: data.lookingFor || null,
        status: 'OPEN',
      },
    });
  }

  public static async getOpportunities(status?: OpportunityStatus, category?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    return prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        anonymousAlias: true,
        title: true,
        category: true,
        description: true,
        skillsNeeded: true,
        teamSize: true,
        collaborationMode: true,
        eventName: true,
        externalUrl: true,
        deadline: true,
        additionalInfo: true,
        lookingFor: true,
        status: true,
        createdAt: true,
        creatorId: true,
      },
    });
  }

  public static async getOpportunityById(id: string) {
    return prisma.opportunity.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  public static async updateOpportunity(id: string, data: Partial<Opportunity>) {
    return prisma.opportunity.update({
      where: { id },
      data,
    });
  }

  public static async deleteOpportunity(id: string) {
    return prisma.opportunity.delete({ where: { id } });
  }

  public static async createConversation(opportunityId: string, participantUserIds: string[]) {
    return prisma.conversation.create({
      data: {
        opportunityId,
        participants: {
          create: participantUserIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, displayName: true, anonymousAlias: true },
            },
          },
        },
      },
    });
  }

  public static async findConversationByOpportunityAndUser(opportunityId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        opportunityId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, displayName: true, anonymousAlias: true } },
          },
        },
      },
    });
  }

  public static async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        opportunity: {
          select: { id: true, title: true, anonymousAlias: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, displayName: true, anonymousAlias: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  public static async getMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, displayName: true, anonymousAlias: true },
        },
      },
    });
  }

  public static async createMessage(conversationId: string, senderId: string, content: string) {
    const [msg] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);
    return msg;
  }
}
