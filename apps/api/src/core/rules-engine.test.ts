import { describe, test, expect } from 'bun:test';
import { matchesConditions } from './rules-engine';
import { makeEmail } from '../__test-utils__/fixtures';
import type { RuleConditions } from '../db/schema';

function match(conditions: RuleConditions, emailOverrides: Record<string, unknown> = {}) {
  const email = makeEmail(emailOverrides) as any;
  return matchesConditions(email, conditions);
}

describe('matchesConditions', () => {
  test('empty conditions matches everything', () => {
    expect(match({})).toBe(true);
  });

  test('from: case-insensitive substring match', () => {
    expect(match({ from: 'sender' }, { from: 'Sender@example.com' })).toBe(true);
    expect(match({ from: 'nobody' }, { from: 'sender@example.com' })).toBe(false);
  });

  test('to: case-insensitive substring match', () => {
    expect(match({ to: 'recipient' }, { to: 'recipient@test.com' })).toBe(true);
    expect(match({ to: 'other' }, { to: 'recipient@test.com' })).toBe(false);
  });

  test('subject_contains: case-insensitive substring match', () => {
    expect(match({ subject_contains: 'test' }, { subject: 'Test Subject' })).toBe(true);
    expect(match({ subject_contains: 'missing' }, { subject: 'Test Subject' })).toBe(false);
  });

  test('category: exact match', () => {
    expect(match({ category: 'spam' }, { category: 'spam' })).toBe(true);
    expect(match({ category: 'spam' }, { category: 'newsletter' })).toBe(false);
    expect(match({ category: 'spam' }, { category: null })).toBe(false);
  });

  test('priority_gte: uses 0 as default for null priority', () => {
    expect(match({ priority_gte: 5 }, { priority: 7 })).toBe(true);
    expect(match({ priority_gte: 5 }, { priority: 3 })).toBe(false);
    expect(match({ priority_gte: 1 }, { priority: null })).toBe(false);
  });

  test('priority_lte: uses 10 as default for null priority', () => {
    expect(match({ priority_lte: 5 }, { priority: 3 })).toBe(true);
    expect(match({ priority_lte: 5 }, { priority: 7 })).toBe(false);
    expect(match({ priority_lte: 9 }, { priority: null })).toBe(false);
  });

  test('AND logic: all conditions must match', () => {
    expect(
      match(
        { from: 'sender', subject_contains: 'test', category: 'fyi' },
        { from: 'sender@example.com', subject: 'Test Subject', category: 'fyi' }
      )
    ).toBe(true);

    expect(
      match(
        { from: 'sender', subject_contains: 'test', category: 'spam' },
        { from: 'sender@example.com', subject: 'Test Subject', category: 'fyi' }
      )
    ).toBe(false);
  });
});
