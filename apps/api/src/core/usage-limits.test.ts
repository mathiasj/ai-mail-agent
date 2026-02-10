import { describe, test, expect } from 'bun:test';
import { getTierLimits, checkCanAutoReply } from './usage-limits';

describe('getTierLimits', () => {
  test('free tier has correct limits', () => {
    const limits = getTierLimits('free');
    expect(limits.maxAccounts).toBe(1);
    expect(limits.maxApiKeys).toBe(1);
    expect(limits.emailsPerMonth).toBe(100);
    expect(limits.draftsPerMonth).toBe(10);
    expect(limits.autoReply).toBe(false);
    expect(limits.retentionDays).toBe(30);
  });

  test('starter tier has correct limits', () => {
    const limits = getTierLimits('starter');
    expect(limits.maxAccounts).toBe(3);
    expect(limits.maxApiKeys).toBe(5);
    expect(limits.emailsPerMonth).toBe(1000);
    expect(limits.draftsPerMonth).toBe(100);
    expect(limits.autoReply).toBe(true);
    expect(limits.retentionDays).toBe(90);
  });

  test('pro tier has correct limits', () => {
    const limits = getTierLimits('pro');
    expect(limits.maxAccounts).toBe(10);
    expect(limits.maxApiKeys).toBe(999999);
    expect(limits.emailsPerMonth).toBe(10000);
    expect(limits.draftsPerMonth).toBe(999999);
    expect(limits.autoReply).toBe(true);
    expect(limits.retentionDays).toBe(365);
  });

  test('enterprise tier has correct limits', () => {
    const limits = getTierLimits('enterprise');
    expect(limits.maxAccounts).toBe(999999);
    expect(limits.maxApiKeys).toBe(999999);
    expect(limits.emailsPerMonth).toBe(999999);
    expect(limits.autoReply).toBe(true);
    expect(limits.retentionDays).toBe(999999);
  });

  test('unknown tier falls back to free', () => {
    const limits = getTierLimits('nonexistent');
    expect(limits).toEqual(getTierLimits('free'));
  });
});

describe('checkCanAutoReply', () => {
  test('returns false for free tier', async () => {
    expect(await checkCanAutoReply('free')).toBe(false);
  });

  test('returns true for starter tier', async () => {
    expect(await checkCanAutoReply('starter')).toBe(true);
  });

  test('returns true for pro tier', async () => {
    expect(await checkCanAutoReply('pro')).toBe(true);
  });

  test('returns true for enterprise tier', async () => {
    expect(await checkCanAutoReply('enterprise')).toBe(true);
  });
});
