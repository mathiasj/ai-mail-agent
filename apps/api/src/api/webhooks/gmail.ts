import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { gmailAccounts } from '../../db/schema';
import { emailQueue } from '../../workers/queue';

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.json();

  // Google Pub/Sub sends data as base64 in message.data
  if (!body.message?.data) {
    return c.json({ error: 'Invalid webhook payload' }, 400);
  }

  const decoded = JSON.parse(
    Buffer.from(body.message.data, 'base64').toString('utf-8')
  );

  const { emailAddress, historyId } = decoded;

  if (!emailAddress) {
    return c.json({ error: 'Missing emailAddress' }, 400);
  }

  // Find account by email
  const account = await db.query.gmailAccounts.findFirst({
    where: eq(gmailAccounts.email, emailAddress),
  });

  if (!account || !account.active) {
    console.log(`Webhook for unknown/inactive account: ${emailAddress}`);
    return c.json({ ok: true }); // Ack to prevent retries
  }

  // Queue email fetch job
  await emailQueue.add(
    'fetch-new-emails',
    {
      accountId: account.id,
      userId: account.userId,
      historyId,
    },
    {
      // Deduplicate concurrent webhooks for same account
      jobId: `fetch-${account.id}-${historyId}`,
    }
  );

  return c.json({ ok: true });
});

export default app;
