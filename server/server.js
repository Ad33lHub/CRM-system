import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/config/socket.js';
import config from './src/config/env.js';
import logger from './src/utils/logger.js';
import { initDocumentExpiryCron } from './src/jobs/documentExpiry.cron.js';
import { startReminderCrons } from './src/jobs/reminderCron.job.js';
import { startPaymentAlertCrons } from './src/jobs/paymentAlertCron.job.js';
import './src/jobs/email.job.js';
import './src/jobs/reminder.job.js';

const server = http.createServer(app);

initSocket(server);

let isShuttingDown = false;

async function gracefulShutdown(reason, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.error(`Server shutting down: ${reason}`, { uptime: Math.round(process.uptime()) });

  server.close(async () => {
    try {
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      logger.info('MongoDB connection closed');
    } catch {
      // ignore
    }

    try {
      const redis = await import('./src/config/redis.js');
      await redis.default.quit();
      logger.info('Redis connection closed');
    } catch {
      // ignore
    }

    logger.info('Graceful shutdown complete');
    process.exit(exitCode);
  });

  // Force kill if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(exitCode);
  }, 10000).unref();
}

const startServer = async () => {
  try {
    await connectDB();
    initDocumentExpiryCron();
    startReminderCrons();
    startPaymentAlertCrons();
  } catch (err) {
    logger.warn(`MongoDB connection failed: ${err.message} — proceeding without database`);
  }

  server.listen(config.PORT, () => {
    logger.info('Server started', {
      port: config.PORT,
      env: config.NODE_ENV,
      node: process.version,
    });
  });
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export default server;
