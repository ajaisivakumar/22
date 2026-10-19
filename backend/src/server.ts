import app from './app';
import { env } from './config/env';
import logger from './config/logger';
import { loadStore } from './db/store';

async function initialize(): Promise<void> {
  await loadStore();
  logger.info('🟢 Data store ready.');
}

initialize()
  .then(() => {
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Campus Connect backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`   Frontend origin: ${env.FRONTEND_URL}`);
      logger.info(
        `   Google OAuth: ${env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? 'configured' : 'not configured'}`
      );
    });

    const handleGracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection: %o', reason);
    });
  })
  .catch((err) => {
    logger.error('❌ Fatal error during server initialization: %o', err);
    process.exit(1);
  });
