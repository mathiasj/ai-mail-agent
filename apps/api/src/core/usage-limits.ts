import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { users, gmailAccounts, emails, drafts, apiKeys } from '../db/schema';

export interface TierLimits {
  maxAccounts: number;
  maxApiKeys: number;
  emailsPerMonth: number;
  draftsPerMonth: number;
  autoReply: boolean;
  retentionDays: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxAccounts: 1,
    maxApiKeys: 1,
    emailsPerMonth: 100,
    draftsPerMonth: 10,
    autoReply: false,
    retentionDays: 30,
  },
  starter: {
    maxAccounts: 3,
    maxApiKeys: 5,
    emailsPerMonth: 1000,
    draftsPerMonth: 100,
    autoReply: true,
    retentionDays: 90,
  },
  pro: {
    maxAccounts: 10,
    maxApiKeys: 999999, // Unlimited
    emailsPerMonth: 10000,
    draftsPerMonth: 999999, // Unlimited
    autoReply: true,
    retentionDays: 365,
  },
  enterprise: {
    maxAccounts: 999999,
    maxApiKeys: 999999,
    emailsPerMonth: 999999,
    draftsPerMonth: 999999,
    autoReply: true,
    retentionDays: 999999,
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export async function getUsage(userId: string): Promise<{
  accountCount: number;
  emailsThisMonth: number;
  draftsThisMonth: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [accountResult, emailResult, draftResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(gmailAccounts)
      .where(and(eq(gmailAccounts.userId, userId), eq(gmailAccounts.active, true))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(eq(emails.userId, userId), gte(emails.createdAt, startOfMonth))
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(drafts)
      .where(
        and(eq(drafts.userId, userId), gte(drafts.createdAt, startOfMonth))
      ),
  ]);

  return {
    accountCount: Number(accountResult[0].count),
    emailsThisMonth: Number(emailResult[0].count),
    draftsThisMonth: Number(draftResult[0].count),
  };
}

export async function checkCanAddAccount(userId: string, tier: string): Promise<boolean> {
  const limits = getTierLimits(tier);
  const usage = await getUsage(userId);
  return usage.accountCount < limits.maxAccounts;
}

export async function checkCanProcessEmail(userId: string, tier: string): Promise<boolean> {
  const limits = getTierLimits(tier);
  const usage = await getUsage(userId);
  return usage.emailsThisMonth < limits.emailsPerMonth;
}

export async function checkCanGenerateDraft(userId: string, tier: string): Promise<boolean> {
  const limits = getTierLimits(tier);
  const usage = await getUsage(userId);
  return usage.draftsThisMonth < limits.draftsPerMonth;
}

export async function checkCanCreateApiKey(userId: string, tier: string): Promise<boolean> {
  const limits = getTierLimits(tier);
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), sql`${apiKeys.revokedAt} IS NULL`));
  return Number(result.count) < limits.maxApiKeys;
}

export async function checkCanAutoReply(tier: string): Promise<boolean> {
  return getTierLimits(tier).autoReply;
}

