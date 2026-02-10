import type { RuleConditions, RuleActions, FilteringConditions, FilteringActions } from '../db/schema';

let counter = 0;
function nextId() {
  return `00000000-0000-0000-0000-${String(++counter).padStart(12, '0')}`;
}

export function resetFixtureCounter() {
  counter = 0;
}

export function makeUser(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    email: `user-${id}@test.com`,
    passwordHash: '$2b$12$fakehashfakehashfakehashfakehashfakehashfakehas',
    name: 'Test User',
    inboxrulesTier: 'free' as string,
    dashboardTier: 'free' as string,
    stripeInboxrulesCustomerId: null,
    stripeDashboardCustomerId: null,
    webhookSecret: 'whsec_test_' + id,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function makeEmail(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    accountId: nextId(),
    userId: nextId(),
    gmailId: `gmail-${id}`,
    threadId: `thread-${id}`,
    from: 'sender@example.com',
    to: 'recipient@test.com',
    subject: 'Test Subject',
    body: 'Test body content',
    snippet: 'Test snippet',
    category: null as string | null,
    priority: null as number | null,
    summary: null as string | null,
    entities: null,
    read: false,
    archived: false,
    receivedAt: new Date('2025-01-15'),
    processedAt: null as Date | null,
    createdAt: new Date('2025-01-15'),
    ...overrides,
  };
}

export function makeGmailMessage(overrides: Record<string, unknown> = {}) {
  const defaults = {
    internalDate: String(Date.now()),
    payload: {
      headers: [
        { name: 'From', value: 'sender@example.com' },
        { name: 'To', value: 'recipient@test.com' },
        { name: 'Subject', value: 'Test Subject' },
      ],
      body: {
        data: Buffer.from('Hello, this is a test email.').toString('base64'),
      },
    },
  };
  return { ...defaults, ...overrides };
}

export function makeRule(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    userId: nextId(),
    name: 'Test Rule',
    conditions: {} as RuleConditions,
    actions: {} as RuleActions,
    enabled: true,
    priority: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function makeFilteringRule(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    userId: nextId(),
    name: 'Test Filtering Rule',
    conditions: {} as FilteringConditions,
    actions: { classify: 'newsletter' } as FilteringActions,
    enabled: true,
    priority: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function makeApiKey(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    userId: nextId(),
    name: 'Test API Key',
    keyHash: 'fakehash123',
    keyPrefix: 'mg_live_test',
    type: 'user',
    permissions: { canRead: true, canWrite: false, canDelete: false },
    monthlyQuota: null as number | null,
    lastUsedAt: null as Date | null,
    expiresAt: null as Date | null,
    revokedAt: null as Date | null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}
