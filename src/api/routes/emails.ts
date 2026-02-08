import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client';
import { emails } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

// ─── List emails ─────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  category: z.string().optional(),
  accountId: z.string().uuid().optional(),
  archived: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z.enum(['received_at', 'priority']).default('received_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

app.get('/', async (c) => {
  const { sub } = c.get('user');
  const query = listQuerySchema.parse(c.req.query());

  const conditions = [eq(emails.userId, sub)];

  if (query.category) {
    conditions.push(eq(emails.category, query.category));
  }
  if (query.accountId) {
    conditions.push(eq(emails.accountId, query.accountId));
  }
  if (query.archived !== undefined) {
    conditions.push(eq(emails.archived, query.archived));
  }
  if (query.search) {
    conditions.push(
      or(
        ilike(emails.subject, `%${query.search}%`),
        ilike(emails.from, `%${query.search}%`),
        ilike(emails.snippet, `%${query.search}%`)
      )!
    );
  }

  const offset = (query.page - 1) * query.limit;
  const orderBy =
    query.sort === 'priority'
      ? query.order === 'desc'
        ? desc(emails.priority)
        : asc(emails.priority)
      : query.order === 'desc'
        ? desc(emails.receivedAt)
        : asc(emails.receivedAt);

  const [results, countResult] = await Promise.all([
    db.query.emails.findMany({
      where: and(...conditions),
      orderBy,
      limit: query.limit,
      offset,
      columns: {
        id: true,
        accountId: true,
        gmailId: true,
        threadId: true,
        from: true,
        to: true,
        subject: true,
        snippet: true,
        category: true,
        priority: true,
        summary: true,
        read: true,
        archived: true,
        receivedAt: true,
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(...conditions)),
  ]);

  return c.json({
    emails: results,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: Number(countResult[0].count),
      pages: Math.ceil(Number(countResult[0].count) / query.limit),
    },
  });
});

// ─── Get single email ────────────────────────────────────────────────

app.get('/:id', async (c) => {
  const { sub } = c.get('user');
  const emailId = c.req.param('id');

  const email = await db.query.emails.findFirst({
    where: and(eq(emails.id, emailId), eq(emails.userId, sub)),
    with: { drafts: true },
  });

  if (!email) return c.json({ error: 'Email not found' }, 404);

  // Mark as read
  if (!email.read) {
    await db.update(emails).set({ read: true }).where(eq(emails.id, emailId));
  }

  return c.json({ email });
});

// ─── Archive email ───────────────────────────────────────────────────

app.patch('/:id/archive', async (c) => {
  const { sub } = c.get('user');
  const emailId = c.req.param('id');

  await db
    .update(emails)
    .set({ archived: true })
    .where(and(eq(emails.id, emailId), eq(emails.userId, sub)));

  return c.json({ ok: true });
});

// ─── Unarchive email ─────────────────────────────────────────────────

app.patch('/:id/unarchive', async (c) => {
  const { sub } = c.get('user');
  const emailId = c.req.param('id');

  await db
    .update(emails)
    .set({ archived: false })
    .where(and(eq(emails.id, emailId), eq(emails.userId, sub)));

  return c.json({ ok: true });
});

// ─── Get email stats ─────────────────────────────────────────────────

app.get('/stats/overview', async (c) => {
  const { sub } = c.get('user');

  const stats = await db
    .select({
      category: emails.category,
      count: sql<number>`count(*)`,
    })
    .from(emails)
    .where(and(eq(emails.userId, sub), eq(emails.archived, false)))
    .groupBy(emails.category);

  const unread = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(
      and(eq(emails.userId, sub), eq(emails.read, false), eq(emails.archived, false))
    );

  return c.json({
    categories: stats,
    unread: Number(unread[0].count),
  });
});

export default app;
