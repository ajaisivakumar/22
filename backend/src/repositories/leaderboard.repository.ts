import prisma from '../config/database';
import { LeaderboardEntry } from '@prisma/client';

export class LeaderboardRepository {
  public static async upsertLeaderboardEntry(data: {
    userId: string;
    academicBatch: string;
    semesterMilestone: number;
    validatedCGPA: number;
    semesterResultId?: string;
    displayMode?: string;
    publicDisplayName?: string | null;
    consentGiven: boolean;
    isPublished?: boolean;
  }): Promise<LeaderboardEntry> {
    return prisma.leaderboardEntry.upsert({
      where: {
        userId_academicBatch_semesterMilestone: {
          userId: data.userId,
          academicBatch: data.academicBatch,
          semesterMilestone: data.semesterMilestone,
        },
      },
      update: {
        validatedCGPA: data.validatedCGPA,
        semesterResultId: data.semesterResultId || null,
        displayMode: data.displayMode || 'ANONYMOUS',
        publicDisplayName: data.publicDisplayName || null,
        consentGiven: data.consentGiven,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
      },
      create: {
        userId: data.userId,
        academicBatch: data.academicBatch,
        semesterMilestone: data.semesterMilestone,
        validatedCGPA: data.validatedCGPA,
        semesterResultId: data.semesterResultId || null,
        displayMode: data.displayMode || 'ANONYMOUS',
        publicDisplayName: data.publicDisplayName || null,
        consentGiven: data.consentGiven,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
      },
    });
  }

  public static async getLeaderboard(academicBatch: string, semesterMilestone?: number) {
    const where: any = {
      academicBatch,
      isPublished: true,
      isEligible: true,
      consentGiven: true,
    };
    if (semesterMilestone) {
      where.semesterMilestone = semesterMilestone;
    }

    const entries = await prisma.leaderboardEntry.findMany({
      where,
      orderBy: { validatedCGPA: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            anonymousAlias: true,
          },
        },
      },
    });

    // Sanitize user name according to displayMode
    return entries.map((entry, index) => {
      let displayName = 'Anonymous Student';
      if (entry.displayMode === 'PUBLIC_NAME') {
        displayName = entry.user.name;
      } else if (entry.displayMode === 'CUSTOM_ALIAS') {
        displayName = entry.publicDisplayName || entry.user.displayName || 'Anonymous Student';
      } else {
        displayName = entry.user.anonymousAlias || `Student #${index + 1}`;
      }

      return {
        rank: index + 1,
        id: entry.id,
        displayName,
        displayMode: entry.displayMode,
        validatedCGPA: entry.validatedCGPA,
        semesterMilestone: entry.semesterMilestone,
        academicBatch: entry.academicBatch,
      };
    });
  }

  public static async getUserEntries(userId: string) {
    return prisma.leaderboardEntry.findMany({
      where: { userId },
      orderBy: { semesterMilestone: 'desc' },
    });
  }

  public static async removeUserFromLeaderboard(userId: string, academicBatch: string, semesterMilestone: number) {
    return prisma.leaderboardEntry.deleteMany({
      where: {
        userId,
        academicBatch,
        semesterMilestone,
      },
    });
  }
}
