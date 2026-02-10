import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { drafts, emails } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';
import { requirePermission } from '../middleware/permissions';
import { sendDraft } from '../../workers/draft-generator';
import { notifyUser } from './sse';

const app = new Hono();

app.use('*', authMiddleware);

// ─── Create draft (external write) ──────────────────────────────────

const createDraftSchema = z.object({
  emailId: z.string().uuid(),
  content: z.string().min(1),
});

app.post('/', requirePermission('write'), async (c) => {
  const { sub } = c.get('user');
  const body = createDraftSchema.parse(await c.req.json());

  const email = await db.query.emails.findFirst({
    where: and(eq(emails.id, body.emailId), eq(emails.userId, sub)),
  });

  if (!email) return c.json({ error: 'Email not found' }, 404);

  const [draft] = await db
    .insert(drafts)
    .values({
      emailId: body.emailId,
      userId: sub,
      content: body.content,
    })
    .returning();

  notifyUser(sub, {
    type: 'draft_generated',
    data: { draftId: draft.id, emailId: body.emailId, preview: body.content.slice(0, 200) },
  });

  return c.json({ draft }, 201);
});

// ─── List drafts ─────────────────────────────────────────────────────

app.get('/', async (c) => {
  const { sub } = c.get('user');

  const userDrafts = await db.query.drafts.findMany({
    where: and(eq(drafts.userId, sub), eq(drafts.sent, false)),
    orderBy: desc(drafts.createdAt),
    with: {
      email: {
        columns: {
          id: true,
          from: true,
          subject: true,
          snippet: true,
        },
      },
    },
  });

  return c.json({ drafts: userDrafts });
});

// ─── Get single draft ────────────────────────────────────────────────

app.get('/:id', async (c) => {
  const { sub } = c.get('user');
  const draftId = c.req.param('id');

  const draft = await db.query.drafts.findFirst({
    where: and(eq(drafts.id, draftId), eq(drafts.userId, sub)),
    with: {
      email: true,
    },
  });

  if (!draft) return c.json({ error: 'Draft not found' }, 404);
  return c.json({ draft });
});

// ─── Update draft content ────────────────────────────────────────────

app.patch('/:id', async (c) => {
  const { sub } = c.get('user');
  const draftId = c.req.param('id');
  const { content } = await c.req.json();

  if (!content) {
    return c.json({ error: 'content is required' }, 400);
  }

  await db
    .update(drafts)
    .set({ content })
    .where(and(eq(drafts.id, draftId), eq(drafts.userId, sub)));

  return c.json({ ok: true });
});

// ─── Approve and send draft ──────────────────────────────────────────

app.post('/:id/send', async (c) => {
  const { sub } = c.get('user');
  const draftId = c.req.param('id');

  const draft = await db.query.drafts.findFirst({
    where: and(eq(drafts.id, draftId), eq(drafts.userId, sub)),
  });

  if (!draft) return c.json({ error: 'Draft not found' }, 404);
  if (draft.sent) return c.json({ error: 'Draft already sent' }, 400);

  // Mark as approved
  await db
    .update(drafts)
    .set({ approved: true })
    .where(eq(drafts.id, draftId));

  // Send
  await sendDraft(draftId);

  return c.json({ message: 'Draft sent successfully' });
});

// ─── Delete draft ────────────────────────────────────────────────────

app.delete('/:id', async (c) => {
  const { sub } = c.get('user');
  const draftId = c.req.param('id');

  await db
    .delete(drafts)
    .where(and(eq(drafts.id, draftId), eq(drafts.userId, sub)));

  return c.json({ ok: true });
});

export default app;
