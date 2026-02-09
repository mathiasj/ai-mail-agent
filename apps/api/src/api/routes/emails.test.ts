import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { createMockDb } from '../../__test-utils__/db-mock';
import { makeEmail } from '../../__test-utils__/fixtures';

// Mock DB before importing route
const mockDb = createMockDb();
mock.module('../../db/client', () => ({ db: mockDb }));

const emailRoutes = (await import('./emails')).default;
const { signToken } = await import('../../auth/jwt');

function createApp() {
  const app = new Hono();
  app.route('/emails', emailRoutes);
  return app;
}

async function authHeader(overrides: Record<string, unknown> = {}) {
  const token = await signToken({
    sub: 'user-1',
    email: 'test@test.com',
    tier: 'pro',
    ...overrides,
  });
  return { Authorization: `Bearer ${token}` };
}

describe('GET /emails', () => {
  beforeEach(() => {
    mockDb.query.emails.findMany.mockReset();
    mockDb.select.mockReset();
  });

  test('returns paginated list', async () => {
    const app = createApp();
    const headers = await authHeader();

    const emailList = [makeEmail({ userId: 'user-1' }), makeEmail({ userId: 'user-1' })];
    mockDb.query.emails.findMany.mockResolvedValue(emailList);

    // Mock count query: db.select().from().where()
    const countChain = {
      from: mock(() => ({
        where: mock(() => [{ count: 2 }]),
      })),
    };
    mockDb.select.mockReturnValue(countChain as any);

    const res = await app.request('/emails', { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.emails).toHaveLength(2);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.total).toBe(2);
  });

  test('returns 401 without auth', async () => {
    const app = createApp();
    const res = await app.request('/emails');
    expect(res.status).toBe(401);
  });
});

describe('GET /emails/:id', () => {
  beforeEach(() => {
    mockDb.query.emails.findFirst.mockReset();
    mockDb.update.mockReset();
  });

  test('returns email and marks as read', async () => {
    const app = createApp();
    const headers = await authHeader();
    const email = makeEmail({ userId: 'user-1', read: false });
    mockDb.query.emails.findFirst.mockResolvedValue(email);

    // Mock the mark-as-read update
    const updateChain = {
      set: mock(() => ({
        where: mock(() => {}),
      })),
    };
    mockDb.update.mockReturnValue(updateChain as any);

    const res = await app.request(`/emails/${email.id}`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email.id).toBe(email.id);
    // Verify update was called to mark as read
    expect(mockDb.update).toHaveBeenCalled();
  });

  test('returns 404 for email not found (wrong user)', async () => {
    const app = createApp();
    const headers = await authHeader();
    mockDb.query.emails.findFirst.mockResolvedValue(null);

    const res = await app.request('/emails/nonexistent-id', { headers });
    expect(res.status).toBe(404);
  });

  test('does not update when email already read', async () => {
    const app = createApp();
    const headers = await authHeader();
    const email = makeEmail({ userId: 'user-1', read: true });
    mockDb.query.emails.findFirst.mockResolvedValue(email);

    const res = await app.request(`/emails/${email.id}`, { headers });
    expect(res.status).toBe(200);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe('PATCH /emails/:id/archive', () => {
  beforeEach(() => {
    mockDb.update.mockReset();
  });

  test('archives email', async () => {
    const app = createApp();
    const headers = await authHeader();

    const updateChain = {
      set: mock(() => ({
        where: mock(() => {}),
      })),
    };
    mockDb.update.mockReturnValue(updateChain as any);

    const res = await app.request('/emails/email-123/archive', {
      method: 'PATCH',
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });
});
