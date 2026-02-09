import { describe, test, expect } from 'bun:test';
import { getTierLimits, checkCanAutoReply, checkCanUseAIClassification } from './usage-limits';

describe('getTierLimits', () => {
  test('free tier has correct limits', () => {
    const limits = getTierLimits('free');
    expect(limits.maxAccounts).toBe(1);
    expect(limits.emailsPerMonth).toBe(100);
    expect(limits.draftsPerMonth).toBe(10);
    expect(limits.autoReply).toBe(false);
    expect(limits.retentionDays).toBe(30);
  });

  test('pro tier has correct limits', () => {
    const limits = getTierLimits('pro');
    expect(limits.maxAccounts).toBe(3);
    expect(limits.emailsPerMonth).toBe(1000);
    expect(limits.draftsPerMonth).toBe(100);
    expect(limits.autoReply).toBe(true);
    expect(limits.retentionDays).toBe(90);
  });

  test('team tier has correct limits', () => {
    const limits = getTierLimits('team');
    expect(limits.maxAccounts).toBe(10);
    expect(limits.emailsPerMonth).toBe(10000);
    expect(limits.autoReply).toBe(true);
    expect(limits.retentionDays).toBe(365);
  });

  test('enterprise tier has correct limits', () => {
    const limits = getTierLimits('enterprise');
    expect(limits.maxAccounts).toBe(999999);
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

  test('returns true for pro tier', async () => {
    expect(await checkCanAutoReply('pro')).toBe(true);
  });

  test('returns true for team tier', async () => {
    expect(await checkCanAutoReply('team')).toBe(true);
  });

  test('returns true for enterprise tier', async () => {
    expect(await checkCanAutoReply('enterprise')).toBe(true);
  });
});

describe('checkCanUseAIClassification', () => {
  test('returns false for free tier', async () => {
    expect(await checkCanUseAIClassification('free')).toBe(false);
  });

  test('returns true for pro tier', async () => {
    expect(await checkCanUseAIClassification('pro')).toBe(true);
  });

  test('returns true for team tier', async () => {
    expect(await checkCanUseAIClassification('team')).toBe(true);
  });

  test('returns true for enterprise tier', async () => {
    expect(await checkCanUseAIClassification('enterprise')).toBe(true);
  });

  test('returns false for unknown tier', async () => {
    expect(await checkCanUseAIClassification('unknown')).toBe(false);
  });
});
