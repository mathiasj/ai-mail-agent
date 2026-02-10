import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { drafts } from '../db/schema';
import { getAccessToken, getGmailClient } from '../auth/gmail-oauth';

export async function sendDraft(draftId: string): Promise<void> {
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      email: {
        with: { account: true },
      },
    },
  });

  if (!draft || !draft.email.account) {
    throw new Error(`Draft ${draftId} or associated account not found`);
  }

  const accessToken = await getAccessToken(draft.email.account.refreshToken);
  const gmail = getGmailClient(accessToken);

  const rawEmail = createRawEmail({
    to: draft.email.from,
    subject: `Re: ${draft.email.subject}`,
    body: draft.content,
  });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawEmail,
      threadId: draft.email.threadId,
    },
  });

  await db
    .update(drafts)
    .set({ sent: true, sentAt: new Date() })
    .where(eq(drafts.id, draftId));

  console.log(`Draft ${draftId} sent successfully`);
}

export function createRawEmail(params: {
  to: string;
  subject: string;
  body: string;
}): string {
  const message = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    params.body,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
