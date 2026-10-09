/**
 * Lead repository.
 * Encapsulates all database access for Lead records.
 */

import type { Lead, LeadStatus, Prisma } from '@prisma/client';
import prisma from './prismaClient';
import { maskMobileNumber } from '../services/calculationService';

export interface CreateLeadData {
  applicationId: string;
  customerName: string;
  mobileNumber: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  schemeId: string;
  pureGoldGrams: number;
  goldValuePaise: bigint;
  eligibleLoanPaise: bigint;
  status?: LeadStatus;
  userId?: string;
}

/**
 * Find a recent lead (within 7 days) for the given mobile number.
 * Used for duplicate detection.
 */
export async function findRecentLeadByMobile(
  mobileNumber: string,
  withinDays = 7
): Promise<Lead | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);

  return prisma.lead.findFirst({
    where: {
      mobileNumber,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a lead within a transaction to prevent race conditions.
 */
export async function createLead(data: CreateLeadData): Promise<Lead> {
  return prisma.$transaction(async (tx) => {
    // Re-check for duplicates inside the transaction (concurrency safety)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const existing = await tx.lead.findFirst({
      where: {
        mobileNumber: data.mobileNumber,
        createdAt: { gte: cutoff },
      },
    });

    if (existing) {
      throw new DuplicateLeadError(existing.applicationId);
    }

    return tx.lead.create({
      data: {
        applicationId: data.applicationId,
        customerName: data.customerName,
        mobileNumber: data.mobileNumber,
        grossWeightGrams: data.grossWeightGrams,
        netWeightGrams: data.netWeightGrams,
        karat: data.karat,
        schemeId: data.schemeId,
        pureGoldGrams: data.pureGoldGrams,
        goldValuePaise: data.goldValuePaise,
        eligibleLoanPaise: data.eligibleLoanPaise,
        status: data.status ?? 'SUBMITTED',
        userId: data.userId,
      },
    });
  });
}

export class DuplicateLeadError extends Error {
  constructor(public readonly existingApplicationId: string) {
    super('A recent application already exists for this mobile number.');
    this.name = 'DuplicateLeadError';
  }
}

export interface LeadListItem {
  applicationId: string;
  customerName: string;
  maskedMobile: string;
  netWeightGrams: string;
  selectedPlan: {
    id: string;
    name: string;
  };
  eligibleLoanRupees: number;
  status: LeadStatus;
  createdAt: Date;
}

/**
 * Get leads with masking, optional plan filter, and pagination.
 * Returns newest-first.
 */
export async function getLeads(
  planId?: string,
  userId?: string,
  page = 1,
  limit = 20
): Promise<{ leads: LeadListItem[]; total: number }> {
  const where: Prisma.LeadWhereInput = {
    ...(planId ? { schemeId: planId } : {}),
    ...(userId ? { userId } : {}),
  };

  const [rawLeads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      include: { scheme: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  const leads: LeadListItem[] = rawLeads.map((lead) => ({
    applicationId: lead.applicationId,
    customerName: lead.customerName,
    maskedMobile: maskMobileNumber(lead.mobileNumber),
    netWeightGrams: lead.netWeightGrams.toString(),
    selectedPlan: {
      id: lead.scheme.id,
      name: lead.scheme.name,
    },
    eligibleLoanRupees: Number(lead.eligibleLoanPaise) / 100,
    status: lead.status,
    createdAt: lead.createdAt,
  }));

  return { leads, total };
}

/**
 * Get a single lead by its applicationId.
 */
export async function getLeadByApplicationId(applicationId: string) {
  const lead = await prisma.lead.findUnique({
    where: { applicationId },
    include: { scheme: { select: { id: true, name: true, annualInterestRate: true, maxLtv: true } } },
  });

  if (!lead) return null;

  return {
    applicationId: lead.applicationId,
    customerName: lead.customerName,
    mobileNumber: lead.mobileNumber, // full for user's own tracking
    grossWeightGrams: lead.grossWeightGrams.toString(),
    netWeightGrams: lead.netWeightGrams.toString(),
    karat: lead.karat,
    selectedPlan: {
      id: lead.scheme.id,
      name: lead.scheme.name,
      annualInterestRatePercent: (Number(lead.scheme.annualInterestRate) * 100).toString(),
      maxLtvPercent: (Number(lead.scheme.maxLtv) * 100).toString(),
    },
    pureGoldGrams: lead.pureGoldGrams.toString(),
    goldValueRupees: Number(lead.goldValuePaise) / 100,
    eligibleLoanRupees: Number(lead.eligibleLoanPaise) / 100,
    status: lead.status,
    createdAt: lead.createdAt,
  };
}
