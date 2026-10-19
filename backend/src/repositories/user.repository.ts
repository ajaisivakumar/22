import prisma from '../config/database';
import { Role, AccountStatus, User } from '@prisma/client';

export class UserRepository {
  public static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  public static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  public static async findByNormalizedEmail(emailNormalized: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { emailNormalized } });
  }

  public static async createUser(data: {
    name: string;
    email: string;
    emailNormalized: string;
    passwordHash?: string;
    role?: Role;
    accountStatus?: AccountStatus;
    emailVerified?: boolean;
    displayName?: string;
    anonymousAlias?: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  public static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  public static async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  public static async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  public static async findEmailVerificationToken(tokenHash: string) {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  public static async markEmailVerificationTokenUsed(id: string) {
    return prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  public static async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  public static async findPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  public static async markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  public static async getAllUsers(skip = 0, take = 50, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountStatus: true,
          emailVerified: true,
          displayName: true,
          anonymousAlias: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
    ]);

    return { total, users };
  }
}
