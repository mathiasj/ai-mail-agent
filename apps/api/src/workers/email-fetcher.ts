import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { emails, gmailAccounts } from '../db/schema';
import { getAccessToken, getGmailClient } from '../auth/gmail-oauth';
import { parseGmailMessage } from '../core/email-parser';
import { notifyUser } from '../api/routes/sse';
import { filterQueue, redisConnection } from './queue';

const worker = new Worker(
  'email-queue',
  async (job) => {
    const { accountId, userId, historyId } = job.data;

    const account = await db.query.gmailAccounts.findFirst({
      where: eq(gmailAccounts.id, accountId),
    });

    if (!account || !account.active) {
      console.log(`Account ${accountId} not found or inactive, skipping`);
      return;
    }

    const accessToken = await getAccessToken(account.refreshToken);
    const gmail = getGmailClient(accessToken);

    // Fetch new messages since last historyId
    const startHistoryId = historyId || account.historyId;
    if (!startHistoryId) {
      console.log(`No historyId for account ${accountId}, performing initial sync`);
      await performInitialSync(gmail, accountId, userId);
      return;
    }

    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded'],
    });

    const messageIds =
      response.data.history
        ?.flatMap((h) => h.messagesAdded?.map((m) => m.message?.id))
        .filter((id): id is string => !!id) || [];

    // Deduplicate
    const uniqueIds = [...new Set(messageIds)];

    console.log(`Fetching ${uniqueIds.length} new messages for account ${accountId}`);

    for (const messageId of uniqueIds) {
      await fetchAndStoreMessage(gmail, messageId, accountId, userId);
    }

    // Update historyId
    if (response.data.historyId) {
      await db
        .update(gmailAccounts)
        .set({ historyId: response.data.historyId })
        .where(eq(gmailAccounts.id, accountId));
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

async function performInitialSync(gmail: any, accountId: string, userId: string) {
  // Fetch last 50 messages for initial sync
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 50,
    labelIds: ['INBOX'],
  });

  const messageIds = response.data.messages?.map((m: any) => m.id) || [];

  for (const messageId of messageIds) {
    await fetchAndStoreMessage(gmail, messageId, accountId, userId);
  }

  // Get current historyId
  const profile = await gmail.users.getProfile({ userId: 'me' });
  await db
    .update(gmailAccounts)
    .set({ historyId: profile.data.historyId })
    .where(eq(gmailAccounts.id, accountId));
}

async function fetchAndStoreMessage(
  gmail: any,
  messageId: string,
  accountId: string,
  userId: string
) {
  // Check if we already have this message
  const existing = await db.query.emails.findFirst({
    where: eq(emails.gmailId, messageId),
  });
  if (existing) return;

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const parsed = parseGmailMessage(message.data);

  const [inserted] = await db
    .insert(emails)
    .values({
      accountId,
      userId,
      gmailId: messageId,
      threadId: message.data.threadId!,
      from: parsed.from,
      to: parsed.to,
      subject: parsed.subject,
      body: parsed.body,
      snippet: message.data.snippet || '',
      receivedAt: parsed.date,
    })
    .onConflictDoNothing({ target: emails.gmailId })
    .returning();

  if (inserted) {
    notifyUser(userId, {
      type: 'new_email',
      data: { id: inserted.id, from: parsed.from, subject: parsed.subject, receivedAt: parsed.date },
    });

    // Queue filtering
    await filterQueue.add('filter-email', {
      emailId: inserted.id,
      userId,
    });
  }
}

worker.on('completed', (job) => {
  console.log(`Email fetch job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Email fetch job ${job?.id} failed:`, err.message);
});

export default worker;
