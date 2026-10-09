/**
 * Prisma client singleton.
 * Ensures only one PrismaClient instance exists during the application lifecycle.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env['NODE_ENV'] === 'development'
    ? ['warn', 'error']
    : ['error'],
});

export default prisma;
