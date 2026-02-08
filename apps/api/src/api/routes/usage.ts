import { Hono } from 'hono';
import { authMiddleware } from '../../auth/middleware';
import { getUsage, getTierLimits } from '../../core/usage-limits';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/', async (c) => {
  const { sub, tier } = c.get('user');
  const [usage, limits] = await Promise.all([
    getUsage(sub),
    Promise.resolve(getTierLimits(tier)),
  ]);

  return c.json({ usage, limits, tier });
});

export default app;
