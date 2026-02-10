import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { emails, rules, type RuleConditions, type RuleActions } from '../db/schema';
import { notifyUser } from '../api/routes/sse';
import { canAutoReply } from './auto-reply-safety';

export async function applyRules(emailId: string, userId: string): Promise<void> {
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  if (!email) return;

  const userRules = await db.query.rules.findMany({
    where: and(eq(rules.userId, userId), eq(rules.enabled, true)),
    orderBy: desc(rules.priority),
  });

  for (const rule of userRules) {
    if (matchesConditions(email, rule.conditions)) {
      await executeActions(email, rule.actions);
      break; // First matching rule wins
    }
  }
}

export function matchesConditions(
  email: typeof emails.$inferSelect,
  conditions: RuleConditions
): boolean {
  if (conditions.from && !email.from.toLowerCase().includes(conditions.from.toLowerCase())) {
    return false;
  }
  if (conditions.to && !email.to.toLowerCase().includes(conditions.to.toLowerCase())) {
    return false;
  }
  if (
    conditions.subject_contains &&
    !email.subject.toLowerCase().includes(conditions.subject_contains.toLowerCase())
  ) {
    return false;
  }
  if (conditions.category && email.category !== conditions.category) {
    return false;
  }
  if (conditions.priority_gte && (email.priority ?? 0) < conditions.priority_gte) {
    return false;
  }
  if (conditions.priority_lte && (email.priority ?? 10) > conditions.priority_lte) {
    return false;
  }
  return true;
}

async function executeActions(
  email: typeof emails.$inferSelect,
  actions: RuleActions
): Promise<void> {
  const updates: Partial<typeof emails.$inferInsert> = {};

  if (actions.classify) {
    updates.category = actions.classify;
  }
  if (actions.archive) {
    updates.archived = true;
  }
  if (actions.mark_read) {
    updates.read = true;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(emails).set(updates).where(eq(emails.id, email.id));
  }

  if (actions.auto_reply) {
    // Safety check before auto-replying
    const safety = await canAutoReply(email.userId, email.from);
    if (safety.allowed) {
      // Notify via SSE — external AI agent handles draft generation
      notifyUser(email.userId, {
        type: 'auto_reply_triggered',
        data: { emailId: email.id, template: actions.reply_template },
      });
    } else {
      console.log(`Auto-reply blocked for email ${email.id}: ${safety.reason}`);
    }
  }
}
