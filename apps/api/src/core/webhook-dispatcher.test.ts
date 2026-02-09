import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';

// Mock env before importing
mock.module('../config/env', () => ({
  env: {
    WEBHOOK_SECRET: 'test-secret-key-for-hmac',
  },
}));

import type { WebhookPayload } from './webhook-dispatcher';
const { dispatchWebhook } = await import('./webhook-dispatcher');

function makeWebhookPayload(overrides: Partial<WebhookPayload> = {}): WebhookPayload {
  return {
    event: 'email.filtered',
    timestamp: '2025-01-15T12:00:00.000Z',
    email: {
      id: 'email-1',
      from: 'sender@example.com',
      to: 'recipient@test.com',
      subject: 'Test Subject',
      snippet: 'Test snippet content',
      receivedAt: '2025-01-15T10:00:00.000Z',
    },
    rule: {
      id: 'rule-1',
      name: 'Archive newsletters',
    },
    ...overrides,
  };
}

describe('webhook-dispatcher', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('sends POST with correct payload and headers', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('OK', { status: 200 }))
    );
    globalThis.fetch = fetchMock as any;

    const payload = makeWebhookPayload();
    await dispatchWebhook('https://example.com/webhook', payload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/webhook');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-MailGate-Event']).toBe('email.filtered');
    expect(options.headers['X-MailGate-Signature']).toBeDefined();
    expect(typeof options.headers['X-MailGate-Signature']).toBe('string');
    expect(options.headers['X-MailGate-Signature'].length).toBe(64); // SHA-256 hex = 64 chars

    const sentBody = JSON.parse(options.body);
    expect(sentBody.event).toBe('email.filtered');
    expect(sentBody.email.id).toBe('email-1');
    expect(sentBody.rule.name).toBe('Archive newsletters');
  });

  test('generates valid HMAC-SHA256 signature', async () => {
    let capturedSignature = '';
    const fetchMock = mock((url: string, opts: any) => {
      capturedSignature = opts.headers['X-MailGate-Signature'];
      return Promise.resolve(new Response('OK', { status: 200 }));
    });
    globalThis.fetch = fetchMock as any;

    const payload = makeWebhookPayload();
    await dispatchWebhook('https://example.com/webhook', payload, 'my-secret');

    // Verify signature is a hex string of correct length
    expect(capturedSignature).toMatch(/^[0-9a-f]{64}$/);

    // Verify reproducibility: same payload + secret = same signature
    await dispatchWebhook('https://example.com/webhook', payload, 'my-secret');
    const secondSignature =
      fetchMock.mock.calls[1][1].headers['X-MailGate-Signature'];
    expect(secondSignature).toBe(capturedSignature);
  });

  test('does not retry on 4xx client errors', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Bad Request', { status: 400 }))
    );
    globalThis.fetch = fetchMock as any;

    await dispatchWebhook('https://example.com/webhook', makeWebhookPayload());

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('retries on 5xx server errors with backoff', async () => {
    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve(new Response('Server Error', { status: 500 }));
      }
      return Promise.resolve(new Response('OK', { status: 200 }));
    });
    globalThis.fetch = fetchMock as any;

    await dispatchWebhook('https://example.com/webhook', makeWebhookPayload());

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('retries on network errors', async () => {
    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject(new Error('Connection refused'));
      }
      return Promise.resolve(new Response('OK', { status: 200 }));
    });
    globalThis.fetch = fetchMock as any;

    await dispatchWebhook('https://example.com/webhook', makeWebhookPayload());

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('does not throw after all retries exhausted', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Server Error', { status: 500 }))
    );
    globalThis.fetch = fetchMock as any;

    // Should not throw — fire and forget
    await dispatchWebhook('https://example.com/webhook', makeWebhookPayload());

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('uses custom secret when provided', async () => {
    const signatures: string[] = [];
    const fetchMock = mock((_url: string, opts: any) => {
      signatures.push(opts.headers['X-MailGate-Signature']);
      return Promise.resolve(new Response('OK', { status: 200 }));
    });
    globalThis.fetch = fetchMock as any;

    const payload = makeWebhookPayload();
    await dispatchWebhook('https://example.com/webhook', payload, 'secret-a');
    await dispatchWebhook('https://example.com/webhook', payload, 'secret-b');

    // Different secrets produce different signatures
    expect(signatures[0]).not.toBe(signatures[1]);
  });

  test('includes classification data when present', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('OK', { status: 200 }))
    );
    globalThis.fetch = fetchMock as any;

    const payload = makeWebhookPayload({
      event: 'email.classified',
      classification: { category: 'action-required', priority: 8, summary: 'Needs reply' },
    });
    await dispatchWebhook('https://example.com/webhook', payload);

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.classification.category).toBe('action-required');
    expect(sentBody.classification.priority).toBe(8);
    expect(sentBody.classification.summary).toBe('Needs reply');
  });
});
