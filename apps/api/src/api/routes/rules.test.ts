import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { createMockDb } from '../../__test-utils__/db-mock';
import { makeRule } from '../../__test-utils__/fixtures';

// Mock DB before importing route
const mockDb = createMockDb();
mock.module('../../db/client', () => ({ db: mockDb }));

const ruleRoutes = (await import('./rules')).default;
const { signToken } = await import('../../auth/jwt');

function createApp() {
  const app = new Hono();
  app.route('/rules', ruleRoutes);
  return app;
}

async function authHeader() {
  const token = await signToken({ sub: 'user-1', email: 'test@test.com', tier: 'pro' });
  return { Authorization: `Bearer ${token}` };
}

const validRule = {
  name: 'Test Rule',
  conditions: { from: 'boss@company.com' },
  actions: { classify: 'action-required' },
  priority: 10,
  enabled: true,
};

describe('POST /rules', () => {
  beforeEach(() => {
    mockDb.insert.mockReset();
  });

  test('creates rule with valid input — 201', async () => {
    const app = createApp();
    const headers = await authHeader();

    const created = makeRule({ ...validRule, userId: 'user-1' });
    const insertChain = {
      values: mock(() => insertChain),
      returning: mock(() => [created]),
    };
    mockDb.insert.mockReturnValue(insertChain as any);

    const res = await app.request('/rules', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(validRule),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.rule.name).toBe('Test Rule');
  });

  test('returns 400 for invalid input', async () => {
    const app = createApp();
    const headers = await authHeader();

    const res = await app.request('/rules', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }), // name too short, missing required fields
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /rules', () => {
  beforeEach(() => {
    mockDb.query.rules.findMany.mockReset();
  });

  test('lists user rules', async () => {
    const app = createApp();
    const headers = await authHeader();

    const ruleList = [makeRule({ userId: 'user-1' }), makeRule({ userId: 'user-1' })];
    mockDb.query.rules.findMany.mockResolvedValue(ruleList);

    const res = await app.request('/rules', { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rules).toHaveLength(2);
  });
});

describe('GET /rules/:id', () => {
  beforeEach(() => {
    mockDb.query.rules.findFirst.mockReset();
  });

  test('returns rule', async () => {
    const app = createApp();
    const headers = await authHeader();
    const rule = makeRule({ userId: 'user-1' });
    mockDb.query.rules.findFirst.mockResolvedValue(rule);

    const res = await app.request(`/rules/${rule.id}`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rule.id).toBe(rule.id);
  });

  test('returns 404 for other user rule', async () => {
    const app = createApp();
    const headers = await authHeader();
    mockDb.query.rules.findFirst.mockResolvedValue(null);

    const res = await app.request('/rules/other-rule-id', { headers });
    expect(res.status).toBe(404);
  });
});

describe('PUT /rules/:id', () => {
  beforeEach(() => {
    mockDb.update.mockReset();
  });

  test('updates rule', async () => {
    const app = createApp();
    const headers = await authHeader();

    const updated = makeRule({ ...validRule, name: 'Updated Rule' });
    const updateChain = {
      set: mock(() => updateChain),
      where: mock(() => updateChain),
      returning: mock(() => [updated]),
    };
    mockDb.update.mockReturnValue(updateChain as any);

    const res = await app.request('/rules/rule-123', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validRule, name: 'Updated Rule' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rule.name).toBe('Updated Rule');
  });

  test('returns 404 when rule not found', async () => {
    const app = createApp();
    const headers = await authHeader();

    const updateChain = {
      set: mock(() => updateChain),
      where: mock(() => updateChain),
      returning: mock(() => []),
    };
    mockDb.update.mockReturnValue(updateChain as any);

    const res = await app.request('/rules/nonexistent', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(validRule),
    });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /rules/:id/toggle', () => {
  beforeEach(() => {
    mockDb.query.rules.findFirst.mockReset();
    mockDb.update.mockReset();
  });

  test('toggles rule enabled state', async () => {
    const app = createApp();
    const headers = await authHeader();
    const rule = makeRule({ userId: 'user-1', enabled: true });
    mockDb.query.rules.findFirst.mockResolvedValue(rule);

    const updateChain = {
      set: mock(() => updateChain),
      where: mock(() => {}),
    };
    mockDb.update.mockReturnValue(updateChain as any);

    const res = await app.request(`/rules/${rule.id}/toggle`, {
      method: 'PATCH',
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });

  test('returns 404 when rule not found', async () => {
    const app = createApp();
    const headers = await authHeader();
    mockDb.query.rules.findFirst.mockResolvedValue(null);

    const res = await app.request('/rules/nonexistent/toggle', {
      method: 'PATCH',
      headers,
    });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /rules/:id', () => {
  beforeEach(() => {
    mockDb.delete.mockReset();
  });

  test('deletes rule', async () => {
    const app = createApp();
    const headers = await authHeader();

    const deleteChain = {
      where: mock(() => {}),
    };
    mockDb.delete.mockReturnValue(deleteChain as any);

    const res = await app.request('/rules/rule-123', {
      method: 'DELETE',
      headers,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
