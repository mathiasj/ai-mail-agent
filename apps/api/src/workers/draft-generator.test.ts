import { describe, test, expect } from 'bun:test';

// Test the pure createRawEmail function directly — no mocks needed
// We import the exported function after mocking deps to avoid side effects.

import { mock } from 'bun:test';

mock.module('../db/client', () => ({ db: {} }));
mock.module('../auth/gmail-oauth', () => ({
  getAccessToken: mock(),
  getGmailClient: mock(),
  getGmailAuthUrl: mock(),
  handleGmailCallback: mock(),
  setupGmailWatch: mock(),
}));

const { createRawEmail } = await import('./draft-generator');

describe('createRawEmail', () => {
  test('produces valid RFC 2822 base64url-encoded message', () => {
    const raw = createRawEmail({
      to: 'recipient@test.com',
      subject: 'Re: Hello',
      body: 'Thanks for your email!',
    });

    // Should be base64url encoded (no +, /, or trailing =)
    expect(raw).not.toMatch(/[+/=]/);

    // Decode and verify structure
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    expect(decoded).toContain('To: recipient@test.com');
    expect(decoded).toContain('Subject: Re: Hello');
    expect(decoded).toContain('Content-Type: text/plain; charset=utf-8');
    expect(decoded).toContain('Thanks for your email!');
  });

  test('headers and body are separated by blank line', () => {
    const raw = createRawEmail({
      to: 'a@b.com',
      subject: 'Test',
      body: 'Body content',
    });

    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    // RFC 2822: headers separated from body by \r\n\r\n
    expect(decoded).toContain('\r\n\r\n');
    const [headers, body] = decoded.split('\r\n\r\n');
    expect(headers).toContain('To:');
    expect(headers).toContain('Subject:');
    expect(body).toBe('Body content');
  });

  test('handles special characters in body', () => {
    const raw = createRawEmail({
      to: 'user@domain.com',
      subject: 'Special chars',
      body: 'Price: $50 — 100% off! <free>',
    });

    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    expect(decoded).toContain('Price: $50 — 100% off! <free>');
  });

  test('handles unicode in subject and body', () => {
    const raw = createRawEmail({
      to: 'user@test.com',
      subject: 'Meeting 🎉',
      body: 'こんにちは World',
    });

    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    expect(decoded).toContain('Meeting 🎉');
    expect(decoded).toContain('こんにちは World');
  });
});
