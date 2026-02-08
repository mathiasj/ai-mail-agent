import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { filteringRules } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

const filteringRuleSchema = z.object({
  name: z.string().min(1).max(100),
  conditions: z.object({
    from: z.string().optional(),
    fromDomain: z.string().optional(),
    fromRegex: z.string().optional(),
    to: z.string().optional(),
    subject_contains: z.string().optional(),
    subjectRegex: z.string().optional(),
    category: z.string().optional(),
    priority_gte: z.number().optional(),
    priority_lte: z.number().optional(),
  }),
  actions: z.object({
    classify: z.string().optional(),
    archive: z.boolean().optional(),
    mark_read: z.boolean().optional(),
    auto_reply: z.boolean().optional(),
    webhook: z.string().url().optional(),
  }),
  enabled: z.boolean().default(true),
  priority: z.number().int().default(0),
});

// ─── List filtering rules ───────────────────────────────────────────

app.get('/', async (c) => {
  const { sub } = c.get('user');
  const rules = await db.query.filteringRules.findMany({
    where: eq(filteringRules.userId, sub),
    orderBy: desc(filteringRules.priority),
  });
  return c.json({ rules });
});

// ─── Create filtering rule ──────────────────────────────────────────

app.post('/', async (c) => {
  const body = filteringRuleSchema.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: 'Invalid input', details: body.error.flatten() }, 400);
  }

  const { sub } = c.get('user');
  const [rule] = await db
    .insert(filteringRules)
    .values({ userId: sub, ...body.data })
    .returning();

  return c.json({ rule }, 201);
});

// ─── Get filtering rule ─────────────────────────────────────────────

app.get('/:id', async (c) => {
  const { sub } = c.get('user');
  const id = c.req.param('id');

  const rule = await db.query.filteringRules.findFirst({
    where: and(eq(filteringRules.id, id), eq(filteringRules.userId, sub)),
  });

  if (!rule) return c.json({ error: 'Rule not found' }, 404);
  return c.json({ rule });
});

// ─── Update filtering rule ──────────────────────────────────────────

app.put('/:id', async (c) => {
  const { sub } = c.get('user');
  const id = c.req.param('id');

  const body = filteringRuleSchema.partial().safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: 'Invalid input', details: body.error.flatten() }, 400);
  }

  const existing = await db.query.filteringRules.findFirst({
    where: and(eq(filteringRules.id, id), eq(filteringRules.userId, sub)),
  });

  if (!existing) return c.json({ error: 'Rule not found' }, 404);

  const [updated] = await db
    .update(filteringRules)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(filteringRules.id, id))
    .returning();

  return c.json({ rule: updated });
});

// ─── Toggle filtering rule ──────────────────────────────────────────

app.patch('/:id/toggle', async (c) => {
  const { sub } = c.get('user');
  const id = c.req.param('id');

  const existing = await db.query.filteringRules.findFirst({
    where: and(eq(filteringRules.id, id), eq(filteringRules.userId, sub)),
  });

  if (!existing) return c.json({ error: 'Rule not found' }, 404);

  await db
    .update(filteringRules)
    .set({ enabled: !existing.enabled, updatedAt: new Date() })
    .where(eq(filteringRules.id, id));

  return c.json({ enabled: !existing.enabled });
});

// ─── Delete filtering rule ──────────────────────────────────────────

app.delete('/:id', async (c) => {
  const { sub } = c.get('user');
  const id = c.req.param('id');

  const existing = await db.query.filteringRules.findFirst({
    where: and(eq(filteringRules.id, id), eq(filteringRules.userId, sub)),
  });

  if (!existing) return c.json({ error: 'Rule not found' }, 404);

  await db.delete(filteringRules).where(eq(filteringRules.id, id));
  return c.json({ ok: true });
});

export default app;
