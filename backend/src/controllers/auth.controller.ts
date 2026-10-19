import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, generateSecureToken, hashToken, normalizeEmail } from '../utils/crypto';
import emailService from '../services/email.service';
import AuditService from '../audit/audit.service';
import logger from '../config/logger';

export class AuthController {
  public static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, displayName } = req.body;
      const normalized = normalizeEmail(email);

      const existingUser = await UserRepository.findByNormalizedEmail(normalized);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await UserRepository.createUser({
        name,
        email,
        emailNormalized: normalized,
        passwordHash,
        displayName: displayName || name,
        anonymousAlias: `Student_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        role: 'USER',
        accountStatus: 'PENDING_VERIFICATION',
        emailVerified: false,
      });

      // Generate verification token
      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await UserRepository.createEmailVerificationToken(user.id, tokenHash, expiresAt);
      await emailService.sendVerificationEmail(user.email, rawToken);

      await AuditService.log({
        eventType: 'USER_REGISTERED',
        actorId: user.id,
        actorRole: user.role,
        outcome: 'SUCCESS',
        description: `User registered: ${user.email}`,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully. Please check your email to verify your account.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid email or password.',
        });
      }

      req.logIn(user, async (loginErr) => {
        if (loginErr) return next(loginErr);

        await UserRepository.updateLastLogin(user.id);
        await AuditService.log({
          eventType: 'USER_LOGIN',
          actorId: user.id,
          actorRole: user.role,
          outcome: 'SUCCESS',
          description: `User signed in: ${user.email}`,
        });

        return res.status(200).json({
          success: true,
          message: 'Signed in successfully.',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              accountStatus: user.accountStatus,
              emailVerified: user.emailVerified,
              displayName: user.displayName,
              anonymousAlias: user.anonymousAlias,
            },
          },
        });
      });
    })(req, res, next);
  }

  public static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('google', (err: any, user: any) => {
      if (err || !user) {
        logger.error('Google OAuth callback failure: %o', err);
        return res.redirect('/login?error=oauth_failed');
      }

      req.logIn(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        await UserRepository.updateLastLogin(user.id);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }

  public static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const tokenHash = hashToken(token);

      const verificationRecord = await UserRepository.findEmailVerificationToken(tokenHash);
      if (!verificationRecord) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token.',
        });
        return;
      }

      if (verificationRecord.usedAt) {
        res.status(400).json({
          success: false,
          message: 'Verification token has already been used.',
        });
        return;
      }

      if (new Date() > verificationRecord.expiresAt) {
        res.status(400).json({
          success: false,
          message: 'Verification token has expired. Please request a new one.',
        });
        return;
      }

      await UserRepository.markEmailVerificationTokenUsed(verificationRecord.id);
      await UserRepository.updateUser(verificationRecord.userId, {
        emailVerified: true,
        accountStatus: 'ACTIVE',
      });

      await AuditService.log({
        eventType: 'EMAIL_VERIFIED',
        actorId: verificationRecord.userId,
        outcome: 'SUCCESS',
        description: 'Email verified successfully',
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now access all platform features.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const user = await UserRepository.findByNormalizedEmail(normalizeEmail(email));

      if (user && !user.emailVerified) {
        const rawToken = generateSecureToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await UserRepository.createEmailVerificationToken(user.id, tokenHash, expiresAt);
        await emailService.sendVerificationEmail(user.email, rawToken);
      }

      res.status(200).json({
        success: true,
        message: 'If an unverified account exists with this email, a verification link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const user = await UserRepository.findByNormalizedEmail(normalizeEmail(email));

      if (user) {
        const rawToken = generateSecureToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await UserRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);
        await emailService.sendPasswordResetEmail(user.email, rawToken);

        await AuditService.log({
          eventType: 'PASSWORD_RESET_REQUESTED',
          actorId: user.id,
          outcome: 'SUCCESS',
        });
      }

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const tokenHash = hashToken(token);

      const resetRecord = await UserRepository.findPasswordResetToken(tokenHash);
      if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset token.',
        });
        return;
      }

      const passwordHash = await hashPassword(newPassword);
      await UserRepository.updateUser(resetRecord.userId, { passwordHash });
      await UserRepository.markPasswordResetTokenUsed(resetRecord.id);

      await AuditService.log({
        eventType: 'PASSWORD_RESET_COMPLETED',
        actorId: resetRecord.userId,
        outcome: 'SUCCESS',
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. You may now log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.id;
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        if (userId) {
          AuditService.log({
            eventType: 'USER_LOGOUT',
            actorId: userId,
            outcome: 'SUCCESS',
          });
        }
        res.status(200).json({
          success: true,
          message: 'Logged out successfully.',
        });
      });
    });
  }

  public static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await UserRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        anonymousAlias: user.anonymousAlias,
        createdAt: user.createdAt,
      },
    });
  }
}
