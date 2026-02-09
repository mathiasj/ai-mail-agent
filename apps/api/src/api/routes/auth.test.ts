import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { createMockDb } from '../../__test-utils__/db-mock';
import { makeUser } from '../../__test-utils__/fixtures';
import bcrypt from 'bcrypt';

// Mock DB, queue, gmail-oauth before importing route
const mockDb = createMockDb();
mock.module('../../db/client', () => ({ db: mockDb }));
mock.module('../../workers/queue', () => ({
  emailQueue: { add: mock() },
}));
mock.module('../../auth/gmail-oauth', () => ({
  getGmailAuthUrl: mock(() => 'https://accounts.google.com/o/oauth2/auth?...'),
  handleGmailCallback: mock(),
  getAccessToken: mock(),
  setupGmailWatch: mock(),
  getGmailClient: mock(),
}));

const authRoutes = (await import('./auth')).default;
const { signToken } = await import('../../auth/jwt');

import { Hono } from 'hono';

function createApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  return app;
}

describe('POST /auth/signup', () => {
  beforeEach(() => {
    mockDb.query.users.findFirst.mockReset();
    mockDb.insert.mockReset();
  });

  test('valid signup returns 201 with token', async () => {
    const app = createApp();
    mockDb.query.users.findFirst.mockResolvedValue(null); // no existing user

    const newUser = { id: 'new-user-id', email: 'new@test.com', tier: 'free' };
    const insertChain = {
      values: mock(() => insertChain),
      returning: mock(() => [newUser]),
    };
    mockDb.insert.mockReturnValue(insertChain as any);

    const res = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@test.com', password: 'password123' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('new@test.com');
  });

  test('duplicate email returns 409', async () => {
    const app = createApp();
    mockDb.query.users.findFirst.mockResolvedValue(makeUser({ email: 'dup@test.com' }));

    const res = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@test.com', password: 'password123' }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already registered');
  });

  test('invalid input returns 400', async () => {
    const app = createApp();

    const res = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(() => {
    mockDb.query.users.findFirst.mockReset();
  });

  test('valid login returns token and user', async () => {
    const app = createApp();
    const hash = await bcrypt.hash('correctpass', 12);
    const user = makeUser({ email: 'login@test.com', passwordHash: hash });
    mockDb.query.users.findFirst.mockResolvedValue(user);

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@test.com', password: 'correctpass' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('login@test.com');
  });

  test('wrong password returns 401', async () => {
    const app = createApp();
    const hash = await bcrypt.hash('correctpass', 12);
    const user = makeUser({ passwordHash: hash });
    mockDb.query.users.findFirst.mockResolvedValue(user);

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'wrongpass' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid credentials');
  });

  test('unknown email returns 401', async () => {
    const app = createApp();
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@test.com', password: 'password123' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid credentials');
  });
});

describe('GET /auth/me', () => {
  beforeEach(() => {
    mockDb.query.users.findFirst.mockReset();
    mockDb.query.apiKeys.findFirst.mockReset();
  });

  test('returns user with valid JWT', async () => {
    const app = createApp();
    const token = await signToken({ sub: 'user-1', email: 'me@test.com', tier: 'pro' });
    const user = makeUser({ id: 'user-1', email: 'me@test.com', inboxrulesTier: 'pro' });
    mockDb.query.users.findFirst.mockResolvedValue(user);

    const res = await app.request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('me@test.com');
    expect(body.user.tier).toBe('pro');
  });

  test('returns 401 without auth', async () => {
    const app = createApp();

    const res = await app.request('/auth/me');
    expect(res.status).toBe(401);
  });
});
