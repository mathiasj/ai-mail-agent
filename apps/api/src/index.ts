import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { env } from './config/env';
import { rateLimiter } from './api/middleware/rate-limit';
import { auditLogMiddleware } from './api/middleware/audit-log';

// Routes
import authRoutes from './api/routes/auth';
import emailRoutes from './api/routes/emails';
import draftRoutes from './api/routes/drafts';
import ruleRoutes from './api/routes/rules';
import paymentRoutes from './api/routes/payments';
import usageRoutes from './api/routes/usage';
import analyticsRoutes from './api/routes/analytics';
import exportRoutes from './api/routes/export';
import sseRoutes from './api/routes/sse';
import apiKeyRoutes from './api/routes/api-keys';
import auditRoutes from './api/routes/audit';
import filteringRuleRoutes from './api/routes/filtering-rules';

// Webhooks
import gmailWebhook from './api/webhooks/gmail';
import stripeWebhook from './api/webhooks/stripe';

const app = new Hono();

// ─── Global middleware ───────────────────────────────────────────────

app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: [
      env.APP_URL,
      'http://localhost:3001',
      'http://localhost:3004',
      'http://localhost:3006',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// ─── Rate limiting ───────────────────────────────────────────────────

// Strict rate limit on auth endpoints
app.use('/api/auth/signup', rateLimiter({ windowMs: 60000, max: 5, keyPrefix: 'rl:signup' }));
app.use('/api/auth/login', rateLimiter({ windowMs: 60000, max: 10, keyPrefix: 'rl:login' }));

// Moderate rate limit on AI endpoints
app.use('/api/drafts/generate', rateLimiter({ windowMs: 60000, max: 20, keyPrefix: 'rl:draft' }));

// General API rate limit
app.use('/api/*', rateLimiter({ windowMs: 60000, max: 100, keyPrefix: 'rl:api' }));
app.use('/v1/*', rateLimiter({ windowMs: 60000, max: 100, keyPrefix: 'rl:v1' }));

// ─── Audit logging ──────────────────────────────────────────────────

app.use('/api/*', auditLogMiddleware);
app.use('/v1/*', auditLogMiddleware);

// ─── Health check ────────────────────────────────────────────────────

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes (legacy /api prefix) ─────────────────────────────────

app.route('/api/auth', authRoutes);
app.route('/api/emails', emailRoutes);
app.route('/api/drafts', draftRoutes);
app.route('/api/rules', ruleRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/usage', usageRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/export', exportRoutes);
app.route('/api/events', sseRoutes);
app.route('/api/api-keys', apiKeyRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/filtering-rules', filteringRuleRoutes);

// ─── v1 API routes ──────────────────────────────────────────────────

app.route('/v1/auth', authRoutes);
app.route('/v1/emails', emailRoutes);
app.route('/v1/drafts', draftRoutes);
app.route('/v1/rules', ruleRoutes);
app.route('/v1/payments', paymentRoutes);
app.route('/v1/usage', usageRoutes);
app.route('/v1/analytics', analyticsRoutes);
app.route('/v1/export', exportRoutes);
app.route('/v1/events', sseRoutes);
app.route('/v1/api-keys', apiKeyRoutes);
app.route('/v1/audit', auditRoutes);
app.route('/v1/filtering-rules', filteringRuleRoutes);

// ─── Webhooks (no auth) ─────────────────────────────────────────────

app.route('/webhooks/gmail', gmailWebhook);
app.route('/webhooks/stripe', stripeWebhook);

// ─── 404 ─────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// ─── Error handler ───────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
    500
  );
});

// ─── Start server ────────────────────────────────────────────────────

console.log(`Starting server on port ${env.PORT}...`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
