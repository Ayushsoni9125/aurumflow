/**
 * Loan scheme repository.
 * Encapsulates all database access for LoanScheme records.
 */

import prisma from './prismaClient';
import type { LoanScheme } from '@prisma/client';

export async function getActiveSchemes(): Promise<LoanScheme[]> {
  return prisma.loanScheme.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getSchemeById(id: string): Promise<LoanScheme | null> {
  return prisma.loanScheme.findUnique({
    where: { id },
  });
}

export async function getActiveSchemeById(id: string): Promise<LoanScheme | null> {
  return prisma.loanScheme.findFirst({
    where: { id, isActive: true },
  });
}
