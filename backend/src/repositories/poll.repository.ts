import prisma from '../config/database';
import { PollStatus, Poll } from '@prisma/client';

export class PollRepository {
  public static async createPoll(data: {
    question: string;
    createdById: string;
    resultsVisibility?: string;
    closesAt?: Date;
    options: string[];
  }): Promise<Poll> {
    return prisma.poll.create({
      data: {
        question: data.question,
        createdById: data.createdById,
        resultsVisibility: data.resultsVisibility || 'AFTER_VOTE',
        closesAt: data.closesAt || null,
        status: 'ACTIVE',
        publishedAt: new Date(),
        options: {
          create: data.options.map((optionText, index) => ({
            optionText,
            displayOrder: index,
          })),
        },
      },
      include: {
        options: true,
      },
    });
  }

  public static async getActivePolls(userId?: string) {
    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
        votes: userId ? { where: { userId } } : false,
      },
    });

    return polls;
  }

  public static async getPollById(id: string, userId?: string) {
    return prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
        votes: userId ? { where: { userId } } : false,
      },
    });
  }

  public static async castVote(pollId: string, optionId: string, userId: string) {
    return prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });
  }

  public static async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const vote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId, userId },
      },
    });
    return !!vote;
  }

  public static async updatePoll(id: string, data: Partial<Poll>) {
    return prisma.poll.update({
      where: { id },
      data,
    });
  }

  public static async deletePoll(id: string) {
    return prisma.poll.delete({ where: { id } });
  }

  public static async getAllPollsAdmin() {
    return prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        options: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { votes: true } },
      },
    });
  }
}
