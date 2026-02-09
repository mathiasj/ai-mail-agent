import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { google } from 'googleapis';
import { db } from '../db/client';
import { emails, drafts, gmailAccounts } from '../db/schema';
import { getAccessToken, getGmailClient } from '../auth/gmail-oauth';
import { notifyUser } from '../api/routes/sse';
import { redisConnection } from './queue';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const DRAFT_PROMPT = `You are a professional email assistant. Write a reply to this email.

From: {from}
Subject: {subject}
Body: {body}

{template_instruction}

Requirements:
- Professional but friendly tone
- Keep it concise (2-3 paragraphs max)
- Match the formality level of the original email
- Do NOT include subject line
- Do NOT include greetings like "Dear..." if the original is casual
- Sign with just a first name placeholder: [Your Name]

Return ONLY the email body text.`;

const worker = new Worker(
  'draft-queue',
  async (job) => {
    const { emailId, userId, autoSend, template } = job.data;

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
      with: { account: true },
    });

    if (!email) {
      console.log(`Email ${emailId} not found, skipping draft`);
      return;
    }

    const templateInstruction = template
      ? `Use this as a guide for the reply style/content: "${template}"`
      : '';

    const prompt = DRAFT_PROMPT
      .replace('{from}', email.from)
      .replace('{subject}', email.subject)
      .replace('{body}', (email.body || '').slice(0, 3000))
      .replace('{template_instruction}', templateInstruction);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional email assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const draftContent = completion.choices[0].message.content;
    if (!draftContent) throw new Error('Empty draft response');

    const [draft] = await db
      .insert(drafts)
      .values({
        emailId,
        userId,
        content: draftContent,
        approved: autoSend ?? false,
      })
      .returning();

    console.log(`Draft ${draft.id} generated for email ${emailId}`);

    notifyUser(userId, {
      type: 'draft_generated',
      data: { draftId: draft.id, emailId, preview: draftContent.slice(0, 200) },
    });

    // If auto-send is approved, send immediately
    if (autoSend && email.account) {
      await sendDraft(draft.id);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60000,
    },
  }
);

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

worker.on('completed', (job) => {
  console.log(`Draft job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Draft job ${job?.id} failed:`, err.message);
});

export default worker;
