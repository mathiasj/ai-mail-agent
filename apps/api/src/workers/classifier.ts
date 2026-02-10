import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db/client';
import { emails, users } from '../db/schema';
import { applyRules } from '../core/rules-engine';
import { tryRuleBasedFiltering } from '../core/filtering-engine';
import { dispatchWebhook, type WebhookPayload } from '../core/webhook-dispatcher';
import { checkCanUseAIClassification } from '../core/usage-limits';
import { notifyUser } from '../api/routes/sse';
import { redisConnection } from './queue';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const CLASSIFY_PROMPT = `Analyze this email and return a JSON classification.

From: {from}
Subject: {subject}
Body (truncated): {body}

Return ONLY valid JSON with this exact structure:
{
  "category": "action-required" | "fyi" | "meeting" | "newsletter" | "spam" | "automated",
  "priority": <number 1-10>,
  "summary": "<one sentence summary>",
  "entities": {
    "people": ["<name>"],
    "companies": ["<company>"],
    "dates": ["<YYYY-MM-DD>"],
    "amounts": ["<$X.XX>"]
  }
}

Category rules:
- "action-required": Needs a response or action from the recipient (priority 7-10)
- "fyi": Informational, no action needed (priority 4-6)
- "meeting": Calendar invites or meeting-related (priority 6-8)
- "newsletter": Marketing emails, digests, updates (priority 1-3)
- "spam": Unsolicited commercial or phishing (priority 0-1)
- "automated": No-reply system notifications like shipping, receipts (priority 2-4)`;

const worker = new Worker(
  'classify-queue',
  async (job) => {
    const { emailId, userId } = job.data;

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      console.log(`Email ${emailId} not found, skipping classification`);
      return;
    }

    // Skip if already classified
    if (email.category) return;

    // Step 1: Try rule-based filtering first (free for all tiers)
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

    // Step 2: Check if user tier allows AI classification
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return;

    const canUseAI = await checkCanUseAIClassification(user.dashboardTier || user.inboxrulesTier);
    if (!canUseAI) {
      console.log(`Email ${emailId}: user on free tier, no AI classification (left as uncategorized)`);
      return;
    }

    // Step 3: AI classification
    const prompt = CLASSIFY_PROMPT
      .replace('{from}', email.from)
      .replace('{subject}', email.subject)
      .replace('{body}', (email.body || '').slice(0, 2000));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an email classification assistant. Return only valid JSON, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('Empty classification response');

    const result = JSON.parse(content);

    await db
      .update(emails)
      .set({
        category: result.category,
        priority: result.priority,
        summary: result.summary,
        entities: result.entities,
        processedAt: new Date(),
      })
      .where(eq(emails.id, emailId));

    console.log(
      `Classified email ${emailId} (AI): ${result.category} (priority ${result.priority})`
    );

    notifyUser(userId, {
      type: 'email_classified',
      data: { emailId, category: result.category, priority: result.priority, method: 'ai' },
    });

    // Apply user rules after classification
    await applyRules(emailId, userId);
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 30, // Max 30 classifications per minute (OpenAI rate limit buffer)
      duration: 60000,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Classification job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Classification job ${job?.id} failed:`, err.message);
});

export default worker;
