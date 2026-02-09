import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { createMockDb } from '../__test-utils__/db-mock';

// Mock DB before importing the module under test
const mockDb = createMockDb();
mock.module('../db/client', () => ({ db: mockDb }));

const { canAutoReply } = await import('./auto-reply-safety');

function mockDbCountResult(count: number) {
  const chain = {
    innerJoin: mock(() => chain),
    where: mock(() => [{ count }]),
  };
  mockDb.select.mockReturnValue({
    from: mock(() => chain),
  } as any);
}

describe('canAutoReply', () => {
  beforeEach(() => {
    // Default: no recent replies
    mockDbCountResult(0);
  });

  test('blocks noreply@ addresses', async () => {
    const result = await canAutoReply('user1', 'noreply@company.com');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('no-reply pattern');
  });

  test('blocks no-reply@ addresses', async () => {
    const result = await canAutoReply('user1', 'no-reply@company.com');
    expect(result.allowed).toBe(false);
  });

  test('blocks donotreply@ addresses', async () => {
    const result = await canAutoReply('user1', 'donotreply@company.com');
    expect(result.allowed).toBe(false);
  });

  test('blocks mailer-daemon@ addresses', async () => {
    const result = await canAutoReply('user1', 'mailer-daemon@company.com');
    expect(result.allowed).toBe(false);
  });

  test('blocks notifications@ addresses', async () => {
    const result = await canAutoReply('user1', 'notifications@company.com');
    expect(result.allowed).toBe(false);
  });

  test('blocks alerts@ addresses', async () => {
    const result = await canAutoReply('user1', 'alerts@company.com');
    expect(result.allowed).toBe(false);
  });

  test('case-insensitive pattern matching', async () => {
    const result = await canAutoReply('user1', 'NoReply@Company.com');
    expect(result.allowed).toBe(false);
  });

  test('allows normal senders', async () => {
    const result = await canAutoReply('user1', 'john@example.com');
    expect(result.allowed).toBe(true);
  });

  test('blocks custom blocklist entries', async () => {
    const result = await canAutoReply('user1', 'spam@bad.com', {
      blocklist: ['spam@bad.com'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('blocklisted');
  });

  test('respects cooldown — blocks when recently replied', async () => {
    // First DB call (cooldown check) returns count > 0
    const cooldownChain = {
      innerJoin: mock(() => cooldownChain),
      where: mock(() => [{ count: 1 }]),
    };
    mockDb.select.mockReturnValueOnce({
      from: mock(() => cooldownChain),
    } as any);

    const result = await canAutoReply('user1', 'john@example.com');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cooldown active');
  });

  test('respects daily limit', async () => {
    // First call (cooldown): no recent replies
    const cooldownChain = {
      innerJoin: mock(() => cooldownChain),
      where: mock(() => [{ count: 0 }]),
    };
    mockDb.select.mockReturnValueOnce({
      from: mock(() => cooldownChain),
    } as any);

    // Second call (daily): at limit
    const dailyChain = {
      innerJoin: mock(() => dailyChain),
      where: mock(() => [{ count: 3 }]),
    };
    mockDb.select.mockReturnValueOnce({
      from: mock(() => dailyChain),
    } as any);

    const result = await canAutoReply('user1', 'john@example.com');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Daily limit');
  });
});
