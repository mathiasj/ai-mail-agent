import { Hono } from 'hono';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, subscriptions } from '../../db/schema';
import { authMiddleware } from '../../auth/middleware';
import { env } from '../../config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const app = new Hono();

const TIER_PRICES: Record<string, string> = {
  starter: env.STRIPE_PRICE_STARTER,
  pro: env.STRIPE_PRICE_PRO,
};

// ─── Create checkout session ─────────────────────────────────────────

app.post('/checkout', authMiddleware, async (c) => {
  const { sub } = c.get('user');
  const { tier } = await c.req.json();

  if (!tier || !TIER_PRICES[tier]) {
    return c.json({ error: 'Invalid tier' }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, sub),
  });

  if (!user) return c.json({ error: 'User not found' }, 404);

  // Create or get Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, sub));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    client_reference_id: sub,
    line_items: [{ price: TIER_PRICES[tier], quantity: 1 }],
    subscription_data: {
      metadata: { tier, userId: sub },
    },
    success_url: `${env.APP_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/pricing`,
  });

  return c.json({ url: session.url });
});

// ─── Billing portal ──────────────────────────────────────────────────

app.post('/portal', authMiddleware, async (c) => {
  const { sub } = c.get('user');

  const user = await db.query.users.findFirst({
    where: eq(users.id, sub),
  });

  if (!user?.stripeCustomerId) {
    return c.json({ error: 'No billing account' }, 400);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${env.APP_URL}/settings/billing`,
  });

  return c.json({ url: session.url });
});

// ─── Get subscription status ─────────────────────────────────────────

app.get('/subscription', authMiddleware, async (c) => {
  const { sub } = c.get('user');

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, sub),
  });

  return c.json({ subscription: subscription || null });
});

export default app;
