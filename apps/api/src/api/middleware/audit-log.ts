import type { Context, Next } from 'hono';
import { db } from '../../db/client';
import { auditLogs } from '../../db/schema';

function getAction(method: string, path: string): { action: string; resource: string } {
  const segments = path.split('/').filter(Boolean);
  // e.g. /api/emails/123 -> resource: emails, or /v1/emails -> resource: emails
  const resource = segments.find(
    (s) => !['api', 'v1', 'webhooks'].includes(s) && !/^[0-9a-f-]{36}$/.test(s)
  ) || 'unknown';

  const actionMap: Record<string, string> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };

  return {
    action: actionMap[method] || method.toLowerCase(),
    resource,
  };
}

export async function auditLogMiddleware(c: Context, next: Next) {
  await next();

  // Only log for authenticated requests
  const user = c.get('user');
  if (!user) return;

  const apiKey = c.get('apiKey');
  const { action, resource } = getAction(c.req.method, c.req.path);

  // Fire and forget audit log
  db.insert(auditLogs)
    .values({
      userId: user.sub,
      apiKeyId: apiKey?.id ?? null,
      action,
      resource,
      method: c.req.method,
      path: c.req.path,
      statusCode: c.res.status,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null,
      userAgent: c.req.header('user-agent') || null,
    })
    .then(() => {})
    .catch((err) => console.error('Audit log failed:', err));
}
