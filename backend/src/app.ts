import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import pgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import path from 'path';
import passport from './config/passport';
import { env } from './config/env';
import { generalLimiter } from './middleware/rate-limit.middleware';
import { errorHandler } from './middleware/error.middleware';

// Import routers
import authRoutes from './routes/auth.routes';
import pollRoutes from './routes/poll.routes';
import eventRoutes from './routes/event.routes';
import opportunityRoutes from './routes/opportunity.routes';
import lostFoundRoutes from './routes/lostfound.routes';
import complaintRoutes from './routes/complaint.routes';
import cgpaRoutes from './routes/cgpa.routes';
import examRoutes from './routes/exam.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import healthRoutes from './routes/health.routes';

const app = express();

// Trust Render's proxy (fixes express-rate-limit X-Forwarded-For warning)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        env.FRONTEND_URL,
      ];
      if (
        !origin ||
        allowed.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin not allowed: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Express Session setup with connect-pg-simple
// Uses a dedicated pg Pool with keepAlive to survive Neon idle timeouts

const sessionPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,              // small pool for sessions only
  idleTimeoutMillis: 3 * 60 * 1000,  // 3 min (under Neon's 5-min limit)
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 60_000, // start keepalive after 1 min idle
});

// Log and recover from pool errors (stale connections)
sessionPool.on('error', (err) => {
  console.error('[pg-session-pool] Unexpected client error:', err.message);
});

const PgSession = pgSimple(session);
app.use(
  session({
    store: new PgSession({
      pool: sessionPool,           // pass the pool directly (not conString)
      createTableIfMissing: true,
      tableName: 'user_sessions',
      pruneSessionInterval: 60,   // prune expired sessions every 60 seconds
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sid',
    cookie: {
      httpOnly: true,
      secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: env.COOKIE_DOMAIN || undefined,
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global Rate Limiting
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', opportunityRoutes); // contains /api/opportunities and /api/conversations
app.use('/api/lost-and-found', lostFoundRoutes);
app.use('/api/lab-complaints', complaintRoutes);
app.use('/api/cgpa', cgpaRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
