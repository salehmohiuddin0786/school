import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma Client');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected cleanly');
  } catch (error) {
    logger.error('Error during database disconnect:', error.message);
  }
}

export { prisma };
export default prisma;
