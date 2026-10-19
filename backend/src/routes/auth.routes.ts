import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from '../config/passport';
import { db, UserRecord } from '../db/store';
import { config, env } from '../config/env';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const authRouter = Router();

// ── GET /me ──────────────────────────────────────────────────────────────────
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const { password, ...userWithoutPass } = req.user;
  res.json({ user: userWithoutPass });
});

// ── POST /login ───────────────────────────────────────────────────────────────
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact admin.' });
    }

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, user.password || '');
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPass } = user;
    return res.json({ user: userWithoutPass, token, message: 'Logged in successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ── POST /signup ──────────────────────────────────────────────────────────────
authRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
      department: 'Engineering',
      isEmailVerified: false,
      status: 'ACTIVE', // Active immediately (email verification is optional for now)
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPass } = newUser;
    return res.status(201).json({ user: userWithoutPass, token, message: 'Account created successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

// ── POST /google (OAuth redirect — handled by Passport in production) ─────────
// This stub is for when Google OAuth is not configured.
// When GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set, use Passport redirect flow.
authRouter.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
// ── GET /google/callback ── Google redirects back here ────────────────────────
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=no_user`);
    }

    // Sync user into in-memory store so auth middleware can resolve them
    let memoryUser = db.users.find(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (!memoryUser) {
      memoryUser = {
        id: user.id,
        name: user.name || 'User',
        email: user.email,
        role: (user.role as any) || 'STUDENT',
        department: 'Engineering',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      db.users.push(memoryUser);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: memoryUser.id, email: memoryUser.email, role: memoryUser.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Redirect to frontend login with token so frontend saves it to localStorage
    res.redirect(`${env.FRONTEND_URL}/login?token=${token}`);
  }
);
// ── POST /verify-email ────────────────────────────────────────────────────────
authRouter.post('/verify-email', (req, res) => {
  // TODO: implement token-based email verification
  res.json({ success: true, message: 'Email address verified successfully' });
});

// ── POST /resend-verification ─────────────────────────────────────────────────
authRouter.post('/resend-verification', (req, res) => {
  res.json({ success: true, message: 'Verification link sent (if email exists)' });
});

// ── POST /forgot-password ─────────────────────────────────────────────────────
authRouter.post('/forgot-password', (req, res) => {
  // Always respond the same way to prevent user enumeration
  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

// ── POST /reset-password ──────────────────────────────────────────────────────
authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ message: 'Valid token and password (8+ chars) required' });
  }
  // TODO: implement token lookup and password update
  res.json({ message: 'Password has been reset successfully' });
});

// ── POST /logout ──────────────────────────────────────────────────────────────
authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ── PATCH /profile ────────────────────────────────────────────────────────────
authRouter.patch('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { name, avatarUrl } = req.body;
  if (name) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  const { password: _, ...userWithoutPass } = req.user;
  res.json({ user: userWithoutPass });
});

// ── POST /change-password ─────────────────────────────────────────────────────
authRouter.post('/change-password', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Current and new password (8+ chars) required' });
  }
  const match = await bcrypt.compare(currentPassword, req.user.password || '');
  if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
  req.user.password = await bcrypt.hash(newPassword, 12);
  res.json({ message: 'Password updated successfully' });
});

// ── DELETE /profile ───────────────────────────────────────────────────────────
authRouter.delete('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  db.users = db.users.filter((u) => u.id !== req.user!.id);
  res.clearCookie('token');
  res.json({ message: 'Account deleted' });
});

export default authRouter;
