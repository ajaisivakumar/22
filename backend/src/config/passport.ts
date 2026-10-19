import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './database';
import { comparePassword, normalizeEmail } from '../utils/crypto';
import { env } from './env';
import logger from './logger';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        displayName: true,
        anonymousAlias: true,
      },
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const normalized = normalizeEmail(email);
        const user = await prisma.user.findUnique({
          where: { emailNormalized: normalized },
        });

        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        if (user.accountStatus === 'SUSPENDED') {
          return done(null, false, { message: 'Account is suspended.' });
        }

        return done(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          anonymousAlias: user.anonymousAlias,
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          const emailNormalized = normalizeEmail(email);
          const providerId = profile.id;

          // Check if auth provider exists
          let authProvider = await prisma.authProvider.findUnique({
            where: {
              provider_providerId: {
                provider: 'google',
                providerId,
              },
            },
            include: { user: true },
          });

          if (authProvider) {
            return done(null, authProvider.user);
          }

          // Check if user with email already exists
          let user = await prisma.user.findUnique({
            where: { emailNormalized },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: profile.displayName || profile.name?.givenName || 'Google User',
                email,
                emailNormalized,
                emailVerified: true,
                accountStatus: 'ACTIVE',
              },
            });
          }

          await prisma.authProvider.create({
            data: {
              userId: user.id,
              provider: 'google',
              providerId,
            },
          });

          return done(null, user);
        } catch (err) {
          logger.error('Google OAuth error: %o', err);
          return done(err, undefined);
        }
      }
    )
  );
}

export default passport;
