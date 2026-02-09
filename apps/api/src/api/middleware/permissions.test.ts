import { describe, test, expect } from 'bun:test';
import { Hono } from 'hono';
import { requirePermission } from './permissions';

function createApp(...permissions: Parameters<typeof requirePermission>) {
  const app = new Hono();

  // Simulate auth by reading custom headers
  app.use('*', async (c, next) => {
    const authMethod = c.req.header('X-Test-AuthMethod') as 'jwt' | 'api-key' | undefined;
    if (!authMethod) {
      return c.json({ error: 'No auth' }, 401);
    }
    c.set('authMethod', authMethod);

    if (authMethod === 'api-key') {
      const perms = JSON.parse(c.req.header('X-Test-Permissions') || '{}');
      c.set('apiKey', { permissions: perms } as any);
    }

    await next();
  });

  app.get('/test', requirePermission(...permissions), (c) => c.json({ ok: true }));
  return app;
}

describe('requirePermission middleware', () => {
  test('JWT auth always passes permission check', async () => {
    const app = createApp('read', 'write', 'delete');
    const res = await app.request('/test', {
      headers: { 'X-Test-AuthMethod': 'jwt' },
    });
    expect(res.status).toBe(200);
  });

  test('API key with canRead passes read check', async () => {
    const app = createApp('read');
    const res = await app.request('/test', {
      headers: {
        'X-Test-AuthMethod': 'api-key',
        'X-Test-Permissions': JSON.stringify({ canRead: true, canWrite: false, canDelete: false }),
      },
    });
    expect(res.status).toBe(200);
  });

  test('API key without canRead fails read check with 403', async () => {
    const app = createApp('read');
    const res = await app.request('/test', {
      headers: {
        'X-Test-AuthMethod': 'api-key',
        'X-Test-Permissions': JSON.stringify({ canRead: false, canWrite: false, canDelete: false }),
      },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('read permission');
  });

  test('API key without canWrite fails write check', async () => {
    const app = createApp('write');
    const res = await app.request('/test', {
      headers: {
        'X-Test-AuthMethod': 'api-key',
        'X-Test-Permissions': JSON.stringify({ canRead: true, canWrite: false, canDelete: false }),
      },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('write permission');
  });

  test('API key without canDelete fails delete check', async () => {
    const app = createApp('delete');
    const res = await app.request('/test', {
      headers: {
        'X-Test-AuthMethod': 'api-key',
        'X-Test-Permissions': JSON.stringify({ canRead: true, canWrite: true, canDelete: false }),
      },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('delete permission');
  });

  test('multiple permissions: all must pass', async () => {
    const app = createApp('read', 'write');
    // Has read but not write
    const res = await app.request('/test', {
      headers: {
        'X-Test-AuthMethod': 'api-key',
        'X-Test-Permissions': JSON.stringify({ canRead: true, canWrite: false, canDelete: false }),
      },
    });
    expect(res.status).toBe(403);
  });

  test('multiple permissions: pass when all granted', async () => {
    const app = createApp('read', 'write');
    const res = await app.request('/test', {
      headers: {
        'X-Test-AuthMethod': 'api-key',
        'X-Test-Permissions': JSON.stringify({ canRead: true, canWrite: true, canDelete: false }),
      },
    });
    expect(res.status).toBe(200);
  });

  test('no apiKey set for api-key auth returns 401', async () => {
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('authMethod', 'api-key');
      // Don't set apiKey
      await next();
    });
    app.get('/test', requirePermission('read'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(401);
  });
});
