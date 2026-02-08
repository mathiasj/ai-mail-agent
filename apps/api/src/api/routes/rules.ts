import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { rules } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

const ruleSchema = z.object({
  name: z.string().min(1).max(100),
  conditions: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    subject_contains: z.string().optional(),
    category: z.string().optional(),
    priority_gte: z.number().min(0).max(10).optional(),
    priority_lte: z.number().min(0).max(10).optional(),
  }),
  actions: z.object({
    classify: z.string().optional(),
    auto_reply: z.boolean().optional(),
    reply_template: z.string().optional(),
    forward_to_agent: z.string().optional(),
    archive: z.boolean().optional(),
    mark_read: z.boolean().optional(),
  }),
  priority: z.number().min(0).max(100).default(0),
  enabled: z.boolean().default(true),
});

// ─── List rules ──────────────────────────────────────────────────────

app.get('/', async (c) => {
  const { sub } = c.get('user');

  const userRules = await db.query.rules.findMany({
    where: eq(rules.userId, sub),
    orderBy: desc(rules.priority),
  });

  return c.json({ rules: userRules });
});

// ─── Create rule ─────────────────────────────────────────────────────

app.post('/', async (c) => {
  const { sub } = c.get('user');
  const body = ruleSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: 'Invalid input', details: body.error.flatten() }, 400);
  }

  const [rule] = await db
    .insert(rules)
    .values({
      userId: sub,
      name: body.data.name,
      conditions: body.data.conditions,
      actions: body.data.actions,
      priority: body.data.priority,
      enabled: body.data.enabled,
    })
    .returning();

  return c.json({ rule }, 201);
});

// ─── Get rule ────────────────────────────────────────────────────────

app.get('/:id', async (c) => {
  const { sub } = c.get('user');
  const ruleId = c.req.param('id');

  const rule = await db.query.rules.findFirst({
    where: and(eq(rules.id, ruleId), eq(rules.userId, sub)),
  });

  if (!rule) return c.json({ error: 'Rule not found' }, 404);
  return c.json({ rule });
});

// ─── Update rule ─────────────────────────────────────────────────────

app.put('/:id', async (c) => {
  const { sub } = c.get('user');
  const ruleId = c.req.param('id');
  const body = ruleSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: 'Invalid input', details: body.error.flatten() }, 400);
  }

  const [updated] = await db
    .update(rules)
    .set({
      name: body.data.name,
      conditions: body.data.conditions,
      actions: body.data.actions,
      priority: body.data.priority,
      enabled: body.data.enabled,
      updatedAt: new Date(),
    })
    .where(and(eq(rules.id, ruleId), eq(rules.userId, sub)))
    .returning();

  if (!updated) return c.json({ error: 'Rule not found' }, 404);
  return c.json({ rule: updated });
});

// ─── Toggle rule ─────────────────────────────────────────────────────

app.patch('/:id/toggle', async (c) => {
  const { sub } = c.get('user');
  const ruleId = c.req.param('id');

  const existing = await db.query.rules.findFirst({
    where: and(eq(rules.id, ruleId), eq(rules.userId, sub)),
  });

  if (!existing) return c.json({ error: 'Rule not found' }, 404);

  await db
    .update(rules)
    .set({ enabled: !existing.enabled, updatedAt: new Date() })
    .where(eq(rules.id, ruleId));

  return c.json({ enabled: !existing.enabled });
});

// ─── Delete rule ─────────────────────────────────────────────────────

app.delete('/:id', async (c) => {
  const { sub } = c.get('user');
  const ruleId = c.req.param('id');

  await db
    .delete(rules)
    .where(and(eq(rules.id, ruleId), eq(rules.userId, sub)));

  return c.json({ ok: true });
});

export default app;
