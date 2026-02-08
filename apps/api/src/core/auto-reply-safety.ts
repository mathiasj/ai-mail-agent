import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { drafts, emails } from '../db/schema';

interface SafetyConfig {
  cooldownMinutes: number; // Min time between replies to same sender
  maxPerSenderPerDay: number; // Max replies to same sender per day
  blocklist: string[]; // Never auto-reply to these addresses
  noReplyPatterns: string[]; // Patterns to skip (noreply@, no-reply@, etc)
}

const DEFAULT_CONFIG: SafetyConfig = {
  cooldownMinutes: 30,
  maxPerSenderPerDay: 3,
  blocklist: [],
  noReplyPatterns: [
    'noreply@',
    'no-reply@',
    'donotreply@',
    'do-not-reply@',
    'mailer-daemon@',
    'postmaster@',
    'notifications@',
    'alert@',
    'alerts@',
  ],
};

export async function canAutoReply(
  userId: string,
  senderEmail: string,
  config: Partial<SafetyConfig> = {}
): Promise<{ allowed: boolean; reason?: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const senderLower = senderEmail.toLowerCase();

  // Check no-reply patterns
  for (const pattern of cfg.noReplyPatterns) {
    if (senderLower.includes(pattern)) {
      return { allowed: false, reason: `Sender matches no-reply pattern: ${pattern}` };
    }
  }

  // Check blocklist
  for (const blocked of cfg.blocklist) {
    if (senderLower.includes(blocked.toLowerCase())) {
      return { allowed: false, reason: `Sender is blocklisted: ${blocked}` };
    }
  }

  // Don't reply to self
  // (handled by checking if sender is one of user's own accounts)

  // Cooldown: check last reply to this sender
  const cooldownCutoff = new Date(Date.now() - cfg.cooldownMinutes * 60 * 1000);
  const recentReply = await db
    .select({ count: sql<number>`count(*)` })
    .from(drafts)
    .innerJoin(emails, eq(drafts.emailId, emails.id))
    .where(
      and(
        eq(drafts.userId, userId),
        eq(drafts.sent, true),
        eq(emails.from, senderEmail),
        gte(drafts.sentAt, cooldownCutoff)
      )
    );

  if (Number(recentReply[0].count) > 0) {
    return {
      allowed: false,
      reason: `Cooldown active: replied to ${senderEmail} within last ${cfg.cooldownMinutes} minutes`,
    };
  }

  // Max per sender per day
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const dailyReplies = await db
    .select({ count: sql<number>`count(*)` })
    .from(drafts)
    .innerJoin(emails, eq(drafts.emailId, emails.id))
    .where(
      and(
        eq(drafts.userId, userId),
        eq(drafts.sent, true),
        eq(emails.from, senderEmail),
        gte(drafts.sentAt, dayStart)
      )
    );

  if (Number(dailyReplies[0].count) >= cfg.maxPerSenderPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached: ${cfg.maxPerSenderPerDay} replies to ${senderEmail} today`,
    };
  }

  return { allowed: true };
}
