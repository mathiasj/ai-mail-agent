import { describe, test, expect } from 'bun:test';
import { signToken, verifyToken } from './jwt';

describe('JWT sign/verify', () => {
  test('sign → verify roundtrip returns correct payload', async () => {
    const payload = { sub: 'user-123', email: 'test@example.com', tier: 'pro' };
    const token = await signToken(payload);
    const decoded = await verifyToken(token);

    expect(decoded.sub).toBe('user-123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.tier).toBe('pro');
  });

  test('token has correct issuer claim', async () => {
    const token = await signToken({ sub: 'u1', email: 'a@b.com', tier: 'free' });
    const decoded = await verifyToken(token);
    expect(decoded.iss).toBe('ai-mail-agent');
  });

  test('malformed token throws', async () => {
    expect(verifyToken('not.a.valid.token')).rejects.toThrow();
  });

  test('tampered token throws', async () => {
    const token = await signToken({ sub: 'u1', email: 'a@b.com', tier: 'free' });
    // Corrupt the signature part
    const parts = token.split('.');
    parts[2] = parts[2].split('').reverse().join('');
    const tampered = parts.join('.');
    expect(verifyToken(tampered)).rejects.toThrow();
  });
});
