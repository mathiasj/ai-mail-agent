import { describe, test, expect } from 'bun:test';
import { extractDomain, matchesFilteringConditions } from './filtering-engine';
import { makeEmail } from '../__test-utils__/fixtures';
import type { FilteringConditions } from '../db/schema';

describe('extractDomain', () => {
  test('extracts domain from "Name <email@domain.com>" format', () => {
    expect(extractDomain('John Doe <john@example.com>')).toBe('example.com');
  });

  test('extracts domain from bare email address', () => {
    expect(extractDomain('user@company.org')).toBe('company.org');
  });

  test('returns null when no @ sign', () => {
    expect(extractDomain('no-at-sign')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(extractDomain('')).toBeNull();
  });

  test('handles angle brackets correctly', () => {
    expect(extractDomain('Admin <admin@mail.example.co.uk>')).toBe('mail.example.co.uk');
  });
});

describe('matchesFilteringConditions', () => {
  function match(conditions: FilteringConditions, emailOverrides: Record<string, unknown> = {}) {
    const email = makeEmail(emailOverrides) as any;
    return matchesFilteringConditions(email, conditions);
  }

  test('empty conditions matches everything', () => {
    expect(match({})).toBe(true);
  });

  test('from: case-insensitive substring match', () => {
    expect(match({ from: 'sender' }, { from: 'Sender@example.com' })).toBe(true);
    expect(match({ from: 'SENDER' }, { from: 'sender@example.com' })).toBe(true);
    expect(match({ from: 'nobody' }, { from: 'sender@example.com' })).toBe(false);
  });

  test('to: case-insensitive substring match', () => {
    expect(match({ to: 'recipient' }, { to: 'recipient@test.com' })).toBe(true);
    expect(match({ to: 'nobody' }, { to: 'recipient@test.com' })).toBe(false);
  });

  test('subject_contains: case-insensitive substring match', () => {
    expect(match({ subject_contains: 'test' }, { subject: 'Test Subject' })).toBe(true);
    expect(match({ subject_contains: 'MISSING' }, { subject: 'Test Subject' })).toBe(false);
  });

  test('fromDomain: extracts and compares domain', () => {
    expect(match({ fromDomain: 'example.com' }, { from: 'John <john@example.com>' })).toBe(true);
    expect(match({ fromDomain: 'other.com' }, { from: 'John <john@example.com>' })).toBe(false);
    // case-insensitive
    expect(match({ fromDomain: 'EXAMPLE.COM' }, { from: 'john@example.com' })).toBe(true);
  });

  test('fromRegex: valid regex matches', () => {
    expect(match({ fromRegex: '^sender@' }, { from: 'sender@example.com' })).toBe(true);
    expect(match({ fromRegex: '^other@' }, { from: 'sender@example.com' })).toBe(false);
  });

  test('fromRegex: invalid regex returns false', () => {
    expect(match({ fromRegex: '[invalid' }, { from: 'sender@example.com' })).toBe(false);
  });

  test('subjectRegex: valid regex matches', () => {
    expect(match({ subjectRegex: 'test.*subject' }, { subject: 'Test Subject' })).toBe(true);
    expect(match({ subjectRegex: '^Nope' }, { subject: 'Test Subject' })).toBe(false);
  });

  test('subjectRegex: invalid regex returns false', () => {
    expect(match({ subjectRegex: '(unclosed' }, { subject: 'Test' })).toBe(false);
  });

  test('category: exact match', () => {
    expect(match({ category: 'spam' }, { category: 'spam' })).toBe(true);
    expect(match({ category: 'spam' }, { category: 'newsletter' })).toBe(false);
  });

  test('priority_gte: uses 0 as default for null priority', () => {
    expect(match({ priority_gte: 5 }, { priority: 7 })).toBe(true);
    expect(match({ priority_gte: 5 }, { priority: 3 })).toBe(false);
    // null priority defaults to 0
    expect(match({ priority_gte: 1 }, { priority: null })).toBe(false);
  });

  test('priority_lte: uses 10 as default for null priority', () => {
    expect(match({ priority_lte: 5 }, { priority: 3 })).toBe(true);
    expect(match({ priority_lte: 5 }, { priority: 7 })).toBe(false);
    // null priority defaults to 10
    expect(match({ priority_lte: 9 }, { priority: null })).toBe(false);
  });

  test('AND logic: all conditions must match', () => {
    // Both match
    expect(
      match(
        { from: 'sender', subject_contains: 'test' },
        { from: 'sender@example.com', subject: 'Test Subject' }
      )
    ).toBe(true);

    // One fails
    expect(
      match(
        { from: 'sender', subject_contains: 'missing' },
        { from: 'sender@example.com', subject: 'Test Subject' }
      )
    ).toBe(false);
  });
});
