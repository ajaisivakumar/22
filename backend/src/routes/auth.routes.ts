import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from '../config/passport';
import { db, UserRecord, persist, toPublicUser, addAuditLog } from '../db/store';
import { config, env } from '../config/env';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const authRouter = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user: UserRecord): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: '7d',
  });
}

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: !config.isDev,
    sameSite: config.isDev ? 'lax' : 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function authPayload(user: UserRecord, message: string) {
  const token = signToken(user);
  return { user: toPublicUser(user), token, message };
}

authRouter.get('/google/status', (_req, res) => {
  res.json({
    configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  });
});

authRouter.get('/google', (req, res, next) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

authRouter.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err: unknown, oauthUser: UserRecord | false) => {
    if (err || !oauthUser) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    const user = db.users.find((u) => u.id === oauthUser.id) || oauthUser;
    const token = signToken(user);
    setAuthCookie(res, token);
    addAuditLog('USER_GOOGLE_LOGIN', user, 'USER', user.id);
    persist();
    return res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  })(req, res, next);
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  return res.json({ user: toPublicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !user.password) {
      return res.status(401).json({
        message: user?.googleId
          ? 'This account uses Google sign-in. Continue with Google instead.'
          : 'Invalid email or password',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact admin.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = authPayload(user, 'Logged in successfully');
    setAuthCookie(res, payload.token);
    addAuditLog('USER_LOGIN', user, 'USER', user.id);
    persist();
    return res.json(payload);
  } catch {
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

authRouter.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (name.length < 2) {
      return res.status(400).json({ message: 'Please enter your full name' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser: UserRecord = {
      id: 'usr-' + Date.now() + Math.random().toString(36).substring(2, 6),
      name,
      email,
      password: passwordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);

    const payload = authPayload(newUser, 'Account created successfully');
    setAuthCookie(res, payload.token);
    addAuditLog('USER_REGISTERED', newUser, 'USER', newUser.id);
    persist();
    return res.status(201).json(payload);
  } catch {
    return res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

authRouter.post('/verify-email', (_req, res) => {
  res.json({ success: true, message: 'Email address verified successfully' });
});

authRouter.post('/resend-verification', (_req, res) => {
  res.json({ success: true, message: 'If an account exists, a verification link has been sent.' });
});

authRouter.post('/forgot-password', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    db.passwordResets = db.passwordResets.filter((r) => r.userId !== user.id);
    db.passwordResets.push({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    persist();
  }
  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

authRouter.post('/reset-password', async (req, res) => {
  const { token, password, newPassword } = req.body;
  const nextPassword = String(password || newPassword || '');
  if (!token || nextPassword.length < 6) {
    return res.status(400).json({ message: 'A valid token and password (6+ characters) are required' });
  }
  const record = db.passwordResets.find((r) => r.token === token);
  if (!record || new Date(record.expiresAt) < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }
  const user = db.users.find((u) => u.id === record.userId);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }
  user.password = await bcrypt.hash(nextPassword, 12);
  db.passwordResets = db.passwordResets.filter((r) => r.token !== token);
  persist();
  res.json({ message: 'Password has been reset successfully' });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

authRouter.patch('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { name, avatarUrl, department, batch } = req.body;
  if (name) user.name = String(name).trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (department !== undefined) user.department = department;
  if (batch !== undefined) user.batch = batch;
  persist();
  res.json({ user: toPublicUser(user) });
});

authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Current and new password (6+ characters) are required' });
  }
  if (!user.password) {
    return res.status(400).json({ message: 'This account uses Google sign-in. Set a password is not available.' });
  }
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
  user.password = await bcrypt.hash(newPassword, 12);
  persist();
  res.json({ message: 'Password updated successfully' });
});

authRouter.delete('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  db.users = db.users.filter((u) => u.id !== req.user!.id);
  persist();
  res.clearCookie('token');
  res.json({ message: 'Account deleted' });
});

export default authRouter;
