import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { db, UserRecord } from '../db/store';

export type AuthenticatedRequest = Request;

function readToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieToken = (req as Request & { cookies?: { token?: string } }).cookies?.token;
  return cookieToken || null;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact an administrator.' });
    }
    req.user = user as Express.User;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
};

export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = db.users.find((u) => u.id === decoded.id);
    if (user && user.status !== 'SUSPENDED') {
      req.user = user as Express.User;
    }
  } catch {
    // ignore invalid token on public routes
  }
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const role = (req.user as UserRecord | undefined)?.role;
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};
