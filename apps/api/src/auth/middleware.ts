import type { Context, Next } from 'hono';
import { verifyToken, type JWTPayload } from './jwt';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { apiKeys, users } from '../db/schema';

declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
    apiKey?: typeof apiKeys.$inferSelect;
    authMethod?: 'jwt' | 'api-key';
  }
}

export async function authMiddleware(c: Context, next: Next) {
  // Try API key first
  const apiKeyHeader = c.req.header('X-API-Key');
  if (apiKeyHeader) {
    return handleApiKeyAuth(c, next, apiKeyHeader);
  }

  // Fall back to JWT Bearer
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = await verifyToken(token);
    c.set('user', payload);
    c.set('authMethod', 'jwt');
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

async function handleApiKeyAuth(c: Context, next: Next, rawKey: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const key = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });

  if (!key) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  if (key.revokedAt) {
    return c.json({ error: 'API key has been revoked' }, 401);
  }

  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    return c.json({ error: 'API key has expired' }, 401);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, key.userId),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  c.set('user', {
    sub: user.id,
    email: user.email,
    tier: user.inboxrulesTier,
  });
  c.set('apiKey', key);
  c.set('authMethod', 'api-key');

  // Update lastUsedAt (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .then(() => {})
    .catch(() => {});

  await next();
}
