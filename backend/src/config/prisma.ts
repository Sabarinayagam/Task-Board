import { PrismaClient } from '@prisma/client';

// Single shared Prisma Client instance (recommended by Prisma docs to avoid
// exhausting database connections in a long-running Node process).
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
