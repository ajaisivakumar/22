import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import { authRouter } from './routes/auth.routes';
import { pollRouter } from './routes/poll.routes';
import { eventRouter } from './routes/event.routes';
import { opportunityRouter } from './routes/opportunity.routes';
import { lostfoundRouter } from './routes/lostfound.routes';
import { complaintRouter } from './routes/complaint.routes';
import { cgpaRouter } from './routes/cgpa.routes';
import { examRouter } from './routes/exam.routes';
import { leaderboardRouter } from './routes/leaderboard.routes';
import { notificationRouter } from './routes/notification.routes';
import { adminRouter } from './routes/admin.routes';

const app = express();

app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Campus Connect Backend', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/polls', pollRouter);
app.use('/api/events', eventRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/lostfound', lostfoundRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/cgpa', cgpaRouter);
app.use('/api/exams', examRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 Campus Connect Server running on http://localhost:${config.port}`);
  console.log(`📡 Accepting requests from: ${config.frontendUrl}`);
});

export default app;
