import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { createMockDb } from '../__test-utils__/db-mock';
import { makeUser, makeApiKey } from '../__test-utils__/fixtures';
import { signToken } from './jwt';

// Mock DB before importing middleware
const mockDb = createMockDb();
mock.module('../db/client', () => ({ db: mockDb }));

const { authMiddleware } = await import('./middleware');

function mockUpdateChain() {
  const catchFn = mock(() => {});
  const thenFn = mock(() => ({ catch: catchFn }));
  const whereFn = mock(() => ({ then: thenFn, catch: catchFn }));
  const setFn = mock(() => ({ where: whereFn }));
  mockDb.update.mockReturnValue({ set: setFn } as any);
}

function createApp() {
  const app = new Hono();
  app.use('*', authMiddleware);
  app.get('/test', (c) => {
    return c.json({
      user: c.get('user'),
      authMethod: c.get('authMethod'),
      apiKey: c.get('apiKey'),
    });
  });
  return app;
}

describe('authMiddleware', () => {
  beforeEach(() => {
    // Reset mocks
    mockDb.query.apiKeys.findFirst.mockReset();
    mockDb.query.users.findFirst.mockReset();
    mockDb.update.mockReset();
  });

  test('valid JWT Bearer sets user context', async () => {
    const app = createApp();
    const token = await signToken({ sub: 'user-1', email: 'a@b.com', tier: 'pro' });

    const res = await app.request('/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.sub).toBe('user-1');
    expect(body.user.email).toBe('a@b.com');
    expect(body.authMethod).toBe('jwt');
  });

  test('missing Authorization header returns 401', async () => {
    const app = createApp();
    const res = await app.request('/test');
    expect(res.status).toBe(401);
  });

  test('invalid Authorization header (no Bearer) returns 401', async () => {
    const app = createApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Basic abc' },
    });
    expect(res.status).toBe(401);
  });

  test('invalid JWT token returns 401', async () => {
    const app = createApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect(res.status).toBe(401);
  });

  test('valid X-API-Key sets user, apiKey, authMethod context', async () => {
    const app = createApp();
    const user = makeUser({ inboxrulesTier: 'pro' });
    const apiKey = makeApiKey({ userId: user.id });

    mockDb.query.apiKeys.findFirst.mockResolvedValue(apiKey);
    mockDb.query.users.findFirst.mockResolvedValue(user);
    mockUpdateChain();

    const res = await app.request('/test', {
      headers: { 'X-API-Key': 'mg_live_testapikey123' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.sub).toBe(user.id);
    expect(body.user.email).toBe(user.email);
    expect(body.authMethod).toBe('api-key');
    expect(body.apiKey.id).toBe(apiKey.id);
  });

  test('unknown API key returns 401', async () => {
    const app = createApp();
    mockDb.query.apiKeys.findFirst.mockResolvedValue(null);

    const res = await app.request('/test', {
      headers: { 'X-API-Key': 'mg_live_unknown' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid API key');
  });

  test('revoked API key returns 401', async () => {
    const app = createApp();
    const apiKey = makeApiKey({ revokedAt: new Date('2025-01-01') });
    mockDb.query.apiKeys.findFirst.mockResolvedValue(apiKey);

    const res = await app.request('/test', {
      headers: { 'X-API-Key': 'mg_live_revoked' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('revoked');
  });

  test('expired API key returns 401', async () => {
    const app = createApp();
    const apiKey = makeApiKey({ expiresAt: new Date('2020-01-01') });
    mockDb.query.apiKeys.findFirst.mockResolvedValue(apiKey);

    const res = await app.request('/test', {
      headers: { 'X-API-Key': 'mg_live_expired' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('expired');
  });

  test('API key takes priority when both headers present', async () => {
    const app = createApp();
    const user = makeUser();
    const apiKey = makeApiKey({ userId: user.id });
    const token = await signToken({ sub: 'jwt-user', email: 'jwt@test.com', tier: 'free' });

    mockDb.query.apiKeys.findFirst.mockResolvedValue(apiKey);
    mockDb.query.users.findFirst.mockResolvedValue(user);
    mockUpdateChain();

    const res = await app.request('/test', {
      headers: {
        'X-API-Key': 'mg_live_testapikey123',
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authMethod).toBe('api-key');
    // Should use API key user, not JWT user
    expect(body.user.sub).toBe(user.id);
  });
});
