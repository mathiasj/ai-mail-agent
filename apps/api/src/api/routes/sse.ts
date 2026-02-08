import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { verifyToken } from '../../auth/jwt';

// Simple in-memory event emitter for SSE
// In production, use Redis Pub/Sub for multi-instance support
type EventCallback = (event: { type: string; data: any }) => void;

const clients = new Map<string, Set<EventCallback>>();

export function notifyUser(userId: string, event: { type: string; data: any }) {
  const userClients = clients.get(userId);
  if (userClients) {
    for (const callback of userClients) {
      callback(event);
    }
  }
}

const app = new Hono();

app.get('/stream', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.json({ error: 'Missing token' }, 401);
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const userId = payload.sub;

  return streamSSE(c, async (stream) => {
    const callback: EventCallback = (event) => {
      stream.writeSSE({
        event: event.type,
        data: JSON.stringify(event.data),
      });
    };

    // Register client
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(callback);

    // Send heartbeat every 30s
    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: 'heartbeat', data: '' });
    }, 30000);

    // Send initial connection event
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ userId }),
    });

    // Wait for disconnect
    stream.onAbort(() => {
      clearInterval(heartbeat);
      clients.get(userId)?.delete(callback);
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
      }
    });

    // Keep stream alive
    while (true) {
      await stream.sleep(60000);
    }
  });
});

export default app;
