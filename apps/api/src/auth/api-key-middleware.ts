import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { apiKeys, users } from '../db/schema';

declare module 'hono' {
  interface ContextVariableMap {
    apiKey?: typeof apiKeys.$inferSelect;
    authMethod?: 'jwt' | 'api-key';
  }
}

export async function apiKeyMiddleware(c: Context, next: Next) {
  const apiKeyHeader = c.req.header('X-API-Key');
  if (!apiKeyHeader) {
    return next();
  }

  // Hash the key for lookup
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKeyHeader);
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

  // Fetch the user
  const user = await db.query.users.findFirst({
    where: eq(users.id, key.userId),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  // Set context
  c.set('user', {
    sub: user.id,
    email: user.email,
    tier: user.velocityTier,
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
