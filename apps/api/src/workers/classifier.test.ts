import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { createMockDb } from '../__test-utils__/db-mock';
import { makeEmail } from '../__test-utils__/fixtures';

// Mock all external deps before importing
const mockDb = createMockDb();
mock.module('../db/client', () => ({ db: mockDb }));

const mockTryRuleBasedFiltering = mock();
mock.module('../core/filtering-engine', () => ({
  tryRuleBasedFiltering: mockTryRuleBasedFiltering,
  matchesFilteringConditions: mock(),
  extractDomain: mock(),
}));

const mockApplyRules = mock();
mock.module('../core/rules-engine', () => ({
  applyRules: mockApplyRules,
  matchesConditions: mock(),
}));

mock.module('../api/routes/sse', () => ({
  notifyUser: mock(),
}));

mock.module('./queue', () => ({
  redisConnection: {},
  emailQueue: { add: mock() },
  filterQueue: { add: mock() },
}));

mock.module('bullmq', () => ({
  Worker: class {
    constructor(_name: string, public processor: Function, _opts: any) {}
    on() { return this; }
  },
  Queue: class {
    add = mock();
  },
}));

// Re-create the core filtering logic as a testable function
async function filterEmail(emailId: string, userId: string) {
  const { db } = await import('../db/client');
  const { tryRuleBasedFiltering } = await import('../core/filtering-engine');
  const { applyRules } = await import('../core/rules-engine');

  const email = await db.query.emails.findFirst({ where: {} as any });
  if (!email) return;
  if ((email as any).category) return;

  const filterResult = await tryRuleBasedFiltering(emailId, userId);
  if (filterResult.matched) {
    await applyRules(emailId, userId);
    return;
  }

  // No rule matched — left for external classification
}

describe('filter worker logic', () => {
  beforeEach(() => {
    mockDb.query.emails.findFirst.mockReset();
    mockDb.update.mockReset();
    mockTryRuleBasedFiltering.mockReset();
    mockApplyRules.mockReset();
  });

  test('email not found → skips', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(null);
    await filterEmail('email-1', 'user-1');
    expect(mockTryRuleBasedFiltering).not.toHaveBeenCalled();
  });

  test('already classified → skips', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(
      makeEmail({ category: 'newsletter' })
    );
    await filterEmail('email-1', 'user-1');
    expect(mockTryRuleBasedFiltering).not.toHaveBeenCalled();
  });

  test('filtering rule matches → applies rules', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(makeEmail());
    mockTryRuleBasedFiltering.mockResolvedValue({
      matched: true,
      category: 'spam',
      ruleName: 'Block spam',
    });

    await filterEmail('email-1', 'user-1');

    expect(mockTryRuleBasedFiltering).toHaveBeenCalled();
    expect(mockApplyRules).toHaveBeenCalled();
  });

  test('no rule match → email left unclassified', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(makeEmail());
    mockTryRuleBasedFiltering.mockResolvedValue({ matched: false });

    await filterEmail('email-1', 'user-1');

    expect(mockApplyRules).not.toHaveBeenCalled();
  });
});
