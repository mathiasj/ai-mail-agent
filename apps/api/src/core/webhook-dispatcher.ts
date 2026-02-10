import { env } from '../config/env';

export interface WebhookPayload {
  event: 'email.filtered' | 'email.classified';
  timestamp: string;
  email: {
    id: string;
    from: string;
    to: string;
    subject: string;
    snippet: string;
    receivedAt: string;
  };
  classification?: {
    category: string;
    priority: number;
    summary?: string;
  };
  rule?: {
    id: string;
    name: string;
  };
}

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

export async function dispatchWebhook(
  url: string,
  payload: WebhookPayload,
  secret?: string
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = await computeHmac(body, secret || env.WEBHOOK_SECRET);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mailgate-Signature': signature,
          'X-Mailgate-Event': payload.event,
        },
        body,
      });

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        // Success or client error (don't retry 4xx)
        return;
      }

      // 5xx → retry
      console.warn(
        `Webhook ${url} returned ${response.status}, attempt ${attempt + 1}/${MAX_RETRIES}`
      );
    } catch (err) {
      console.warn(
        `Webhook ${url} failed (attempt ${attempt + 1}/${MAX_RETRIES}):`,
        (err as Error).message
      );
    }

    if (attempt < MAX_RETRIES - 1) {
      await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
    }
  }

  console.error(`Webhook ${url} failed after ${MAX_RETRIES} retries, giving up`);
}

async function computeHmac(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
