import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, gmailAccounts } from '../../db/schema';
import { signToken } from '../../auth/jwt';
import { authMiddleware } from '../../auth/middleware';
import {
  getGmailAuthUrl,
  handleGmailCallback,
  getAccessToken,
  setupGmailWatch,
} from '../../auth/gmail-oauth';
import { emailQueue } from '../../workers/queue';

const app = new Hono();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ─── Signup ──────────────────────────────────────────────────────────

app.post('/signup', async (c) => {
  const body = signupSchema.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: 'Invalid input', details: body.error.flatten() }, 400);
  }

  const { email, password, name } = body.data;

  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name })
    .returning({ id: users.id, email: users.email, tier: users.tier });

  const token = await signToken({
    sub: user.id,
    email: user.email,
    tier: user.tier,
  });

  return c.json({ token, user }, 201);
});

// ─── Login ───────────────────────────────────────────────────────────

app.post('/login', async (c) => {
  const body = loginSchema.safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: 'Invalid input' }, 400);
  }

  const { email, password } = body.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    tier: user.tier,
  });

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, tier: user.tier },
  });
});

// ─── Get current user ────────────────────────────────────────────────

app.get('/me', authMiddleware, async (c) => {
  const { sub } = c.get('user');
  const user = await db.query.users.findFirst({
    where: eq(users.id, sub),
    columns: { id: true, email: true, name: true, tier: true, createdAt: true },
  });

  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user });
});

// ─── Gmail OAuth ─────────────────────────────────────────────────────

app.get('/gmail/connect', authMiddleware, async (c) => {
  const { sub } = c.get('user');
  const url = getGmailAuthUrl(sub);
  return c.json({ url });
});

app.get('/gmail/callback', async (c) => {
  const code = c.req.query('code');
  const userId = c.req.query('state');

  if (!code || !userId) {
    return c.json({ error: 'Missing code or state' }, 400);
  }

  const { refreshToken, accessToken, email } = await handleGmailCallback(code);

  // Check if account already connected
  const existing = await db.query.gmailAccounts.findFirst({
    where: eq(gmailAccounts.email, email),
  });

  if (existing) {
    // Update refresh token
    await db
      .update(gmailAccounts)
      .set({ refreshToken, active: true })
      .where(eq(gmailAccounts.id, existing.id));
  } else {
    // Set up Gmail push notifications
    const watch = await setupGmailWatch(accessToken);

    await db.insert(gmailAccounts).values({
      userId,
      email,
      refreshToken,
      historyId: watch.historyId,
      watchExpiry: new Date(parseInt(watch.expiration)),
    });
  }

  // Get the account for initial sync
  const account = await db.query.gmailAccounts.findFirst({
    where: eq(gmailAccounts.email, email),
  });

  if (account) {
    // Trigger initial email sync
    await emailQueue.add('initial-sync', {
      accountId: account.id,
      userId,
      historyId: null, // Full initial sync
    });
  }

  // Redirect to app
  return c.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/inbox?connected=true`);
});

// ─── List connected accounts ─────────────────────────────────────────

app.get('/gmail/accounts', authMiddleware, async (c) => {
  const { sub } = c.get('user');
  const accounts = await db.query.gmailAccounts.findMany({
    where: eq(gmailAccounts.userId, sub),
    columns: { id: true, email: true, active: true, createdAt: true },
  });
  return c.json({ accounts });
});

// ─── Disconnect account ──────────────────────────────────────────────

app.delete('/gmail/accounts/:id', authMiddleware, async (c) => {
  const { sub } = c.get('user');
  const accountId = c.req.param('id');

  await db
    .update(gmailAccounts)
    .set({ active: false })
    .where(eq(gmailAccounts.id, accountId));

  return c.json({ ok: true });
});

export default app;
