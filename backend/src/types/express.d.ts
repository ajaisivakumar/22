import { User as PrismaUser } from '@prisma/client';
import { UserRecord } from '../db/store';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends Omit<Partial<PrismaUser>, 'createdAt'>, Omit<Partial<UserRecord>, 'createdAt'> {
      id: string;
      email: string;
      role: any;
      name?: string;
      displayName?: string;
      anonymousAlias?: string;
      createdAt?: any;
    }
  }
}
