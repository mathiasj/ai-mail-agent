import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { apiKeys } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';

const app = new Hono();

app.use('*', authMiddleware);

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z
    .object({
      canRead: z.boolean().default(true),
      canWrite: z.boolean().default(false),
      canDelete: z.boolean().default(false),
    })
    .default({ canRead: true, canWrite: false, canDelete: false }),
  monthlyQuota: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'mg_live_';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── List API keys ──────────────────────────────────────────────────

app.get('/', async (c) => {
  const { sub } = c.get('user');
  const keys = await db.query.apiKeys.findMany({
    where: and(eq(apiKeys.userId, sub), isNull(apiKeys.revokedAt)),
    columns: {
      id: true,
      name: true,
      keyPrefix: true,
      type: true,
      permissions: true,
      monthlyQuota: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  return c.json({ apiKeys: keys });
});

// ─── Create API key ─────────────────────────────────────────────────

app.post('/', async (c) => {
  const body = createKeySchema.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: 'Invalid input', details: body.error.flatten() }, 400);
  }

  const { sub } = c.get('user');
  const { name, permissions, monthlyQuota, expiresAt } = body.data;

  const rawKey = generateApiKey();
  const keyHash = await hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);

  const [key] = await db
    .insert(apiKeys)
    .values({
      userId: sub,
      name,
      keyHash,
      keyPrefix,
      type: 'user',
      permissions,
      monthlyQuota,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })
    .returning();

  return c.json(
    {
      apiKey: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        type: key.type,
        permissions: key.permissions,
        monthlyQuota: key.monthlyQuota,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
      },
      rawKey, // Only returned once
    },
    201
  );
});

// ─── Get API key ────────────────────────────────────────────────────

app.get('/:id', async (c) => {
  const { sub } = c.get('user');
  const id = c.req.param('id');

  const key = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, id), eq(apiKeys.userId, sub)),
    columns: {
      id: true,
      name: true,
      keyPrefix: true,
      type: true,
      permissions: true,
      monthlyQuota: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  if (!key) return c.json({ error: 'API key not found' }, 404);
  return c.json({ apiKey: key });
});

// ─── Revoke API key ─────────────────────────────────────────────────

app.post('/:id/revoke', async (c) => {
  const { sub } = c.get('user');
  const id = c.req.param('id');

  const key = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, id), eq(apiKeys.userId, sub)),
  });

  if (!key) return c.json({ error: 'API key not found' }, 404);

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, id));

  return c.json({ ok: true });
});

export default app;
