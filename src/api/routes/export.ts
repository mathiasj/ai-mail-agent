import { Hono } from 'hono';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client';
import { emails } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  from: z.string().optional(), // ISO date
  to: z.string().optional(), // ISO date
  category: z.string().optional(),
});

app.get('/', async (c) => {
  const { sub } = c.get('user');
  const query = exportQuerySchema.parse(c.req.query());

  const conditions = [eq(emails.userId, sub)];

  if (query.from) {
    conditions.push(gte(emails.receivedAt, new Date(query.from)));
  }
  if (query.to) {
    conditions.push(lte(emails.receivedAt, new Date(query.to)));
  }
  if (query.category) {
    conditions.push(eq(emails.category, query.category));
  }

  const data = await db.query.emails.findMany({
    where: and(...conditions),
    columns: {
      id: true,
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
    orderBy: (emails, { desc }) => [desc(emails.receivedAt)],
    limit: 10000, // Safety cap
  });

  if (query.format === 'csv') {
    const headers = [
      'id',
      'from',
      'to',
      'subject',
      'category',
      'priority',
      'summary',
      'read',
      'archived',
      'received_at',
    ];

    const rows = data.map((email) =>
      [
        email.id,
        escapeCsv(email.from),
        escapeCsv(email.to),
        escapeCsv(email.subject),
        email.category || '',
        email.priority?.toString() || '',
        escapeCsv(email.summary || ''),
        email.read.toString(),
        email.archived.toString(),
        email.receivedAt.toISOString(),
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="emails-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return c.json({ emails: data, count: data.length });
});

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default app;
