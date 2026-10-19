import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { db, persist, toPublicUser, addAuditLog } from '../db/store';
import logger from './logger';

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  const user = db.users.find((u) => u.id === id);
  done(null, user ? (toPublicUser(user) as Express.User) : false);
});

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
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(null, false, { message: 'Google did not provide an email address.' });
          }

          const googleId = profile.id;
          let user = db.users.find((u) => u.googleId === googleId || u.email.toLowerCase() === email);

          if (user) {
            if (user.status === 'SUSPENDED') {
              return done(null, false, { message: 'Account is suspended.' });
            }
            user.googleId = googleId;
            user.isEmailVerified = true;
            if (!user.avatarUrl && profile.photos?.[0]?.value) {
              user.avatarUrl = profile.photos[0].value;
            }
            persist();
            return done(null, toPublicUser(user) as Express.User);
          }

          user = {
            id: 'usr-' + Date.now() + Math.random().toString(36).slice(2, 6),
            name: profile.displayName || profile.name?.givenName || email.split('@')[0],
            email,
            googleId,
            role: 'STUDENT',
            avatarUrl: profile.photos?.[0]?.value,
            isEmailVerified: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          };
          db.users.push(user);
          addAuditLog('USER_GOOGLE_SIGNUP', user, 'USER', user.id, `Google account linked: ${email}`);
          persist();
          return done(null, toPublicUser(user) as Express.User);
        } catch (err) {
          logger.error('Google OAuth error: %o', err);
          return done(err as Error);
        }
      }
    )
  );
}

export default passport;
