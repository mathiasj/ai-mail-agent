import type { Context, Next } from 'hono';
import { redisConnection } from '../../workers/queue';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimiter(config: RateLimitConfig) {
  const { windowMs, max, keyPrefix = 'rl' } = config;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (c: Context, next: Next) => {
    // Use IP + path as key, or user ID if authenticated
    const user = c.get('user' as any);
    const identifier = user?.sub || c.req.header('x-forwarded-for') || 'anonymous';
    const key = `${keyPrefix}:${identifier}:${c.req.path}`;

    const current = await redisConnection.incr(key);

    if (current === 1) {
      await redisConnection.expire(key, windowSec);
    }

    const remaining = Math.max(0, max - current);

    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());

    if (current > max) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  };
}
