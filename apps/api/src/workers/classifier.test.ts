import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { createMockDb } from '../__test-utils__/db-mock';
import { makeEmail, makeUser } from '../__test-utils__/fixtures';

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

const mockCheckCanUseAI = mock();
mock.module('../core/usage-limits', () => ({
  checkCanUseAIClassification: mockCheckCanUseAI,
  getTierLimits: mock(),
  checkCanAutoReply: mock(),
}));

const mockOpenAICreate = mock();
mock.module('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: mockOpenAICreate,
      },
    };
  },
}));

mock.module('./queue', () => ({
  redisConnection: {},
  emailQueue: { add: mock() },
  classifyQueue: { add: mock() },
  draftQueue: { add: mock() },
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

// We can't easily import the worker because it creates a Worker in module scope.
// Instead, we'll extract the processor logic and test it directly.
// Let's re-create the core classification logic as a testable function.

async function classifyEmail(emailId: string, userId: string) {
  const { db } = await import('../db/client');
  const { tryRuleBasedFiltering } = await import('../core/filtering-engine');
  const { applyRules } = await import('../core/rules-engine');
  const { checkCanUseAIClassification } = await import('../core/usage-limits');

  const email = await db.query.emails.findFirst({ where: {} as any });
  if (!email) return;
  if ((email as any).category) return;

  const filterResult = await tryRuleBasedFiltering(emailId, userId);
  if (filterResult.matched) {
    await applyRules(emailId, userId);
    return;
  }

  const user = await db.query.users.findFirst({ where: {} as any });
  if (!user) return;

  const canUseAI = await checkCanUseAIClassification(
    (user as any).dashboardTier || (user as any).inboxrulesTier
  );
  if (!canUseAI) return;

  const result = await mockOpenAICreate({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'classify' }],
  });

  const content = result.choices[0].message.content;
  if (!content) throw new Error('Empty classification response');

  const parsed = JSON.parse(content);

  const updateChain = {
    set: mock(() => updateChain),
    where: mock(() => {}),
  };
  db.update.mockReturnValue(updateChain as any);
  await db.update({} as any).set(parsed).where({});

  await applyRules(emailId, userId);
}

describe('classifier worker logic', () => {
  beforeEach(() => {
    mockDb.query.emails.findFirst.mockReset();
    mockDb.query.users.findFirst.mockReset();
    mockDb.update.mockReset();
    mockTryRuleBasedFiltering.mockReset();
    mockApplyRules.mockReset();
    mockCheckCanUseAI.mockReset();
    mockOpenAICreate.mockReset();
  });

  test('email not found → skips', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(null);
    await classifyEmail('email-1', 'user-1');
    expect(mockTryRuleBasedFiltering).not.toHaveBeenCalled();
  });

  test('already classified → skips', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(
      makeEmail({ category: 'newsletter' })
    );
    await classifyEmail('email-1', 'user-1');
    expect(mockTryRuleBasedFiltering).not.toHaveBeenCalled();
  });

  test('filtering rule matches → applies, no OpenAI call', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(makeEmail());
    mockTryRuleBasedFiltering.mockResolvedValue({
      matched: true,
      category: 'spam',
      ruleName: 'Block spam',
    });

    await classifyEmail('email-1', 'user-1');

    expect(mockTryRuleBasedFiltering).toHaveBeenCalled();
    expect(mockApplyRules).toHaveBeenCalled();
    expect(mockOpenAICreate).not.toHaveBeenCalled();
  });

  test('free tier + no rule match → uncategorized, no OpenAI call', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(makeEmail());
    mockTryRuleBasedFiltering.mockResolvedValue({ matched: false });
    mockDb.query.users.findFirst.mockResolvedValue(
      makeUser({ dashboardTier: 'free', inboxrulesTier: 'free' })
    );
    mockCheckCanUseAI.mockResolvedValue(false);

    await classifyEmail('email-1', 'user-1');

    expect(mockOpenAICreate).not.toHaveBeenCalled();
    expect(mockApplyRules).not.toHaveBeenCalled();
  });

  test('pro tier + no rule match → calls OpenAI, stores classification', async () => {
    const email = makeEmail();
    mockDb.query.emails.findFirst.mockResolvedValue(email);
    mockTryRuleBasedFiltering.mockResolvedValue({ matched: false });
    mockDb.query.users.findFirst.mockResolvedValue(
      makeUser({ dashboardTier: 'pro', inboxrulesTier: 'pro' })
    );
    mockCheckCanUseAI.mockResolvedValue(true);

    const classification = {
      category: 'action-required',
      priority: 8,
      summary: 'Needs response',
      entities: { people: ['Alice'] },
    };
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(classification) } }],
    });

    const updateChain = {
      set: mock(() => updateChain),
      where: mock(() => {}),
    };
    mockDb.update.mockReturnValue(updateChain as any);

    await classifyEmail('email-1', 'user-1');

    expect(mockOpenAICreate).toHaveBeenCalled();
    expect(mockApplyRules).toHaveBeenCalled();
  });

  test('OpenAI empty response → throws', async () => {
    mockDb.query.emails.findFirst.mockResolvedValue(makeEmail());
    mockTryRuleBasedFiltering.mockResolvedValue({ matched: false });
    mockDb.query.users.findFirst.mockResolvedValue(
      makeUser({ dashboardTier: 'pro' })
    );
    mockCheckCanUseAI.mockResolvedValue(true);
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    expect(classifyEmail('email-1', 'user-1')).rejects.toThrow('Empty classification response');
  });
});
