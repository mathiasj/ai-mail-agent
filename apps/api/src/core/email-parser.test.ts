import { describe, test, expect } from 'bun:test';
import { parseGmailMessage, extractBody, decodeBase64Url, stripHtml } from './email-parser';

function b64(str: string) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

describe('parseGmailMessage', () => {
  test('parses simple text/plain message with correct headers', () => {
    const msg = {
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'From', value: 'alice@example.com' },
          { name: 'To', value: 'bob@example.com' },
          { name: 'Subject', value: 'Hello Bob' },
        ],
        body: { data: b64('Hi Bob, how are you?') },
      },
    };

    const parsed = parseGmailMessage(msg);
    expect(parsed.from).toBe('alice@example.com');
    expect(parsed.to).toBe('bob@example.com');
    expect(parsed.subject).toBe('Hello Bob');
    expect(parsed.body).toBe('Hi Bob, how are you?');
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.date.getTime()).toBe(1700000000000);
  });

  test('parses multipart message, prefers text/plain over text/html', () => {
    const msg = {
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'From', value: 'sender@test.com' },
          { name: 'To', value: 'rcpt@test.com' },
          { name: 'Subject', value: 'Multi' },
        ],
        parts: [
          { mimeType: 'text/html', body: { data: b64('<b>HTML body</b>') } },
          { mimeType: 'text/plain', body: { data: b64('Plain text body') } },
        ],
      },
    };

    const parsed = parseGmailMessage(msg);
    expect(parsed.body).toBe('Plain text body');
  });

  test('falls back to stripped HTML when no text/plain', () => {
    const msg = {
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'From', value: 'a@b.com' },
          { name: 'To', value: 'c@d.com' },
          { name: 'Subject', value: 'HTML only' },
        ],
        parts: [
          { mimeType: 'text/html', body: { data: b64('<p>Hello</p><b>World</b>') } },
        ],
      },
    };

    const parsed = parseGmailMessage(msg);
    expect(parsed.body).toBe('Hello World');
  });

  test('handles nested multipart structures', () => {
    const msg = {
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'From', value: 'a@b.com' },
          { name: 'To', value: 'c@d.com' },
          { name: 'Subject', value: 'Nested' },
        ],
        parts: [
          {
            mimeType: 'multipart/alternative',
            parts: [
              { mimeType: 'text/plain', body: { data: b64('Nested plain text') } },
              { mimeType: 'text/html', body: { data: b64('<p>Nested HTML</p>') } },
            ],
          },
        ],
      },
    };

    const parsed = parseGmailMessage(msg);
    expect(parsed.body).toBe('Nested plain text');
  });

  test('returns empty body/strings for missing data', () => {
    const msg = { internalDate: '0', payload: null };
    const parsed = parseGmailMessage(msg);
    expect(parsed.from).toBe('');
    expect(parsed.to).toBe('');
    expect(parsed.subject).toBe('');
    expect(parsed.body).toBe('');
  });

  test('header lookup is case-insensitive', () => {
    const msg = {
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'FROM', value: 'upper@case.com' },
          { name: 'to', value: 'lower@case.com' },
          { name: 'SUBJECT', value: 'Mixed Case' },
        ],
        body: { data: b64('body') },
      },
    };

    const parsed = parseGmailMessage(msg);
    expect(parsed.from).toBe('upper@case.com');
    expect(parsed.to).toBe('lower@case.com');
    expect(parsed.subject).toBe('Mixed Case');
  });
});

describe('decodeBase64Url', () => {
  test('decodes standard base64', () => {
    const encoded = Buffer.from('Hello World').toString('base64');
    expect(decodeBase64Url(encoded)).toBe('Hello World');
  });

  test('handles URL-safe encoding (- and _)', () => {
    // Create a string that produces + and / in standard base64
    const input = '>>??>>??';
    const urlSafe = Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    expect(decodeBase64Url(urlSafe)).toBe(input);
  });
});

describe('stripHtml', () => {
  test('removes HTML tags', () => {
    expect(stripHtml('<p>Hello</p> <b>World</b>')).toBe('Hello World');
  });

  test('removes style blocks', () => {
    expect(stripHtml('<style>.red{color:red}</style><p>Text</p>')).toBe('Text');
  });

  test('removes script blocks', () => {
    expect(stripHtml('<script>alert("xss")</script><p>Safe</p>')).toBe('Safe');
  });

  test('decodes HTML entities', () => {
    expect(stripHtml('A &amp; B &lt; C &gt; D &quot;E&quot;')).toBe('A & B < C > D "E"');
  });

  test('collapses whitespace', () => {
    expect(stripHtml('<p>  lots   of   spaces  </p>')).toBe('lots of spaces');
  });

  test('replaces &nbsp; with spaces', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world');
  });
});

describe('extractBody', () => {
  test('returns empty string for null payload', () => {
    expect(extractBody(null)).toBe('');
    expect(extractBody(undefined)).toBe('');
  });

  test('extracts from body.data', () => {
    expect(extractBody({ body: { data: b64('direct body') } })).toBe('direct body');
  });

  test('returns empty string when no parts and no body data', () => {
    expect(extractBody({ body: {} })).toBe('');
  });
});
