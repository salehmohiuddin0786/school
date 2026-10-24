import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './db/prisma.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to MySQL Database via Prisma
    await connectDatabase();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start listening on configured port
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 SchoolNext ERP Backend listening on http://localhost:${config.PORT}`);
      logger.info(`📡 Health Check available at http://localhost:${config.PORT}/api/v1/health`);
      logger.info(`🔒 Environment: ${config.NODE_ENV}`);
    });

    // 4. Graceful Shutdown Handlers
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds timeout
      setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    logger.error('Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();
