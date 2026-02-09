import { mock } from 'bun:test';

// Chainable mock builder for Drizzle's `db` import.
// Usage:
//   mock.module('../db/client', () => ({ db: createMockDb() }));
//   then configure per-test: mockDb.query.emails.findFirst.mockResolvedValue(email);

function chainable() {
  const fn = mock(() => chainable());
  // Allow .where(), .set(), .values(), .returning(), .from(), .orderBy(), etc.
  fn.where = mock(() => fn);
  fn.set = mock(() => fn);
  fn.values = mock(() => fn);
  fn.returning = mock(() => fn);
  fn.from = mock(() => fn);
  fn.orderBy = mock(() => fn);
  fn.limit = mock(() => fn);
  fn.offset = mock(() => fn);
  fn.groupBy = mock(() => fn);
  fn.innerJoin = mock(() => fn);
  fn.leftJoin = mock(() => fn);
  fn.then = undefined; // prevent auto-resolution as thenable
  return fn;
}

export function createMockDb() {
  return {
    query: {
      users: {
        findFirst: mock(),
        findMany: mock(),
      },
      emails: {
        findFirst: mock(),
        findMany: mock(),
      },
      drafts: {
        findFirst: mock(),
        findMany: mock(),
      },
      rules: {
        findFirst: mock(),
        findMany: mock(),
      },
      filteringRules: {
        findFirst: mock(),
        findMany: mock(),
      },
      gmailAccounts: {
        findFirst: mock(),
        findMany: mock(),
      },
      apiKeys: {
        findFirst: mock(),
        findMany: mock(),
      },
      auditLogs: {
        findFirst: mock(),
        findMany: mock(),
      },
    },
    select: mock(() => chainable()),
    insert: mock(() => chainable()),
    update: mock(() => chainable()),
    delete: mock(() => chainable()),
  };
}

export type MockDb = ReturnType<typeof createMockDb>;
