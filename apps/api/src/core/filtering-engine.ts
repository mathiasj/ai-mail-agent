import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { emails, filteringRules, type FilteringConditions, type FilteringActions } from '../db/schema';

interface FilteringResult {
  matched: boolean;
  category?: string;
  priority?: number;
  actions?: FilteringActions;
  ruleName?: string;
}

export async function tryRuleBasedFiltering(
  emailId: string,
  userId: string
): Promise<FilteringResult> {
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  if (!email) return { matched: false };

  const userRules = await db.query.filteringRules.findMany({
    where: and(eq(filteringRules.userId, userId), eq(filteringRules.enabled, true)),
    orderBy: desc(filteringRules.priority),
  });

  for (const rule of userRules) {
    if (matchesFilteringConditions(email, rule.conditions)) {
      // Apply the classification from the rule
      const updates: Partial<typeof emails.$inferInsert> = {};

      if (rule.actions.classify) {
        updates.category = rule.actions.classify;
      }
      if (rule.actions.archive) {
        updates.archived = true;
      }
      if (rule.actions.mark_read) {
        updates.read = true;
      }

      // Set a default priority based on category if rule matched
      const categoryPriorities: Record<string, number> = {
        'action-required': 8,
        meeting: 7,
        fyi: 5,
        automated: 3,
        newsletter: 2,
        spam: 1,
      };

      const priority = rule.actions.classify
        ? categoryPriorities[rule.actions.classify] ?? 5
        : undefined;

      if (priority !== undefined) {
        updates.priority = priority;
      }

      updates.processedAt = new Date();

      if (Object.keys(updates).length > 0) {
        await db.update(emails).set(updates).where(eq(emails.id, emailId));
      }

      return {
        matched: true,
        category: rule.actions.classify,
        priority,
        actions: rule.actions,
        ruleName: rule.name,
      };
    }
  }

  return { matched: false };
}

export function matchesFilteringConditions(
  email: typeof emails.$inferSelect,
  conditions: FilteringConditions
): boolean {
  // From - exact match (case-insensitive)
  if (conditions.from && !email.from.toLowerCase().includes(conditions.from.toLowerCase())) {
    return false;
  }

  // From domain - check if sender domain matches
  if (conditions.fromDomain) {
    const senderDomain = extractDomain(email.from);
    if (!senderDomain || senderDomain.toLowerCase() !== conditions.fromDomain.toLowerCase()) {
      return false;
    }
  }

  // From regex
  if (conditions.fromRegex) {
    try {
      const regex = new RegExp(conditions.fromRegex, 'i');
      if (!regex.test(email.from)) return false;
    } catch {
      return false; // Invalid regex, skip
    }
  }

  // To
  if (conditions.to && !email.to.toLowerCase().includes(conditions.to.toLowerCase())) {
    return false;
  }

  // Subject contains
  if (
    conditions.subject_contains &&
    !email.subject.toLowerCase().includes(conditions.subject_contains.toLowerCase())
  ) {
    return false;
  }

  // Subject regex
  if (conditions.subjectRegex) {
    try {
      const regex = new RegExp(conditions.subjectRegex, 'i');
      if (!regex.test(email.subject)) return false;
    } catch {
      return false;
    }
  }

  // Category (post-classification check)
  if (conditions.category && email.category !== conditions.category) {
    return false;
  }

  // Priority range
  if (conditions.priority_gte && (email.priority ?? 0) < conditions.priority_gte) {
    return false;
  }
  if (conditions.priority_lte && (email.priority ?? 10) > conditions.priority_lte) {
    return false;
  }

  return true;
}

export function extractDomain(emailAddress: string): string | null {
  // Handle "Name <email@domain.com>" format
  const match = emailAddress.match(/@([^>]+)/);
  return match ? match[1].trim() : null;
}
