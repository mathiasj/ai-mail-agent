import { Hono } from 'hono';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { auditLogs } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

// ─── List audit logs ────────────────────────────────────────────────

app.get('/', async (c) => {
  const { sub } = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const action = c.req.query('action');
  const resource = c.req.query('resource');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const offset = (page - 1) * limit;

  const conditions = [eq(auditLogs.userId, sub)];

  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }
  if (resource) {
    conditions.push(eq(auditLogs.resource, resource));
  }
  if (from) {
    conditions.push(gte(auditLogs.createdAt, new Date(from)));
  }
  if (to) {
    conditions.push(lte(auditLogs.createdAt, new Date(to)));
  }

  const where = and(...conditions);

  const [logs, countResult] = await Promise.all([
    db.query.auditLogs.findMany({
      where,
      orderBy: desc(auditLogs.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(where!),
  ]);

  const total = Number(countResult[0].count);

  return c.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export default app;
