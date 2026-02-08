import { Hono } from 'hono';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { emails, drafts } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

// ─── Overview stats ──────────────────────────────────────────────────

app.get('/overview', async (c) => {
  const { sub } = c.get('user');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalEmails,
    categoryCounts,
    draftStats,
    dailyVolume,
    topSenders,
  ] = await Promise.all([
    // Total emails (last 30 days)
    db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(and(eq(emails.userId, sub), gte(emails.receivedAt, thirtyDaysAgo))),

    // By category
    db
      .select({
        category: emails.category,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(and(eq(emails.userId, sub), gte(emails.receivedAt, thirtyDaysAgo)))
      .groupBy(emails.category),

    // Draft stats
    db
      .select({
        total: sql<number>`count(*)`,
        sent: sql<number>`count(*) filter (where ${drafts.sent} = true)`,
        approved: sql<number>`count(*) filter (where ${drafts.approved} = true)`,
      })
      .from(drafts)
      .where(and(eq(drafts.userId, sub), gte(drafts.createdAt, thirtyDaysAgo))),

    // Daily email volume (last 30 days)
    db
      .select({
        date: sql<string>`date(${emails.receivedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(and(eq(emails.userId, sub), gte(emails.receivedAt, thirtyDaysAgo)))
      .groupBy(sql`date(${emails.receivedAt})`)
      .orderBy(sql`date(${emails.receivedAt})`),

    // Top senders
    db
      .select({
        sender: emails.from,
        count: sql<number>`count(*)`,
      })
      .from(emails)
      .where(and(eq(emails.userId, sub), gte(emails.receivedAt, thirtyDaysAgo)))
      .groupBy(emails.from)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ]);

  const ds = draftStats[0];

  return c.json({
    period: '30d',
    totalEmails: Number(totalEmails[0].count),
    categories: categoryCounts.map((c) => ({ category: c.category, count: Number(c.count) })),
    drafts: {
      total: Number(ds.total),
      sent: Number(ds.sent),
      approved: Number(ds.approved),
      acceptanceRate: Number(ds.total) > 0 ? Number(ds.sent) / Number(ds.total) : 0,
    },
    dailyVolume: dailyVolume.map((d) => ({ date: d.date, count: Number(d.count) })),
    topSenders: topSenders.map((s) => ({ sender: s.sender, count: Number(s.count) })),
  });
});

// ─── Priority distribution ───────────────────────────────────────────

app.get('/priority', async (c) => {
  const { sub } = c.get('user');

  const distribution = await db
    .select({
      priority: emails.priority,
      count: sql<number>`count(*)`,
    })
    .from(emails)
    .where(eq(emails.userId, sub))
    .groupBy(emails.priority)
    .orderBy(emails.priority);

  return c.json({
    distribution: distribution.map((d) => ({
      priority: d.priority,
      count: Number(d.count),
    })),
  });
});

export default app;
