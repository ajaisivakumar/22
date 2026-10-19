import { UserRecord } from '../db/store';

declare global {
  namespace Express {
    interface User extends UserRecord {}
  }
}

export {};
