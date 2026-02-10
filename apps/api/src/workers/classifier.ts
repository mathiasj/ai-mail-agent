import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { emails, users } from '../db/schema';
import { applyRules } from '../core/rules-engine';
import { tryRuleBasedFiltering } from '../core/filtering-engine';
import { dispatchWebhook, type WebhookPayload } from '../core/webhook-dispatcher';
import { notifyUser } from '../api/routes/sse';
import { redisConnection } from './queue';

const worker = new Worker(
  'filter-queue',
  async (job) => {
    const { emailId, userId } = job.data;

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      console.log(`Email ${emailId} not found, skipping filtering`);
      return;
    }

    // Skip if already classified
    if (email.category) return;

    // Rule-based filtering (free for all tiers)
    const filterResult = await tryRuleBasedFiltering(emailId, userId);
    if (filterResult.matched) {
      console.log(
        `Email ${emailId} matched filtering rule "${filterResult.ruleName}": ${filterResult.category}`
      );
      notifyUser(userId, {
        type: 'email_classified',
        data: { emailId, category: filterResult.category, priority: filterResult.priority, method: 'rule' },
      });

      // Dispatch webhook if configured on the matching rule
      if (filterResult.actions?.webhook) {
        const webhookUser = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        const webhookPayload: WebhookPayload = {
          event: 'email.filtered',
          timestamp: new Date().toISOString(),
          email: {
            id: emailId,
            from: email.from,
            to: email.to,
            subject: email.subject,
            snippet: email.snippet || '',
            receivedAt: email.receivedAt.toISOString(),
          },
          classification: filterResult.category
            ? { category: filterResult.category, priority: filterResult.priority ?? 5 }
            : undefined,
          rule: filterResult.ruleId
            ? { id: filterResult.ruleId, name: filterResult.ruleName! }
            : undefined,
        };
        dispatchWebhook(filterResult.actions.webhook, webhookPayload, webhookUser?.webhookSecret ?? undefined).catch((err) =>
          console.error('Webhook dispatch error:', err)
        );
      }

      // Apply user automation rules after rule-based filtering
      await applyRules(emailId, userId);
      return;
    }

    // No rule matched — email left as uncategorized
    // External AI agents can classify via PATCH /v1/emails/:id/classify
    console.log(`Email ${emailId}: no filtering rule matched (left for external classification)`);
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

worker.on('completed', (job) => {
  console.log(`Filter job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Filter job ${job?.id} failed:`, err.message);
});

export default worker;
