import { Hono } from 'hono';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, subscriptions } from '../../db/schema';
import { env } from '../../config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const app = new Hono();

app.post('/', async (c) => {
  const sig = c.req.header('stripe-signature');
  if (!sig) {
    return c.json({ error: 'Missing stripe-signature' }, 400);
  }

  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(subscription);
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return c.json({ received: true });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.client_reference_id) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const tier = subscription.metadata.tier || 'pro';
  const userId = session.client_reference_id;

  await db.insert(subscriptions).values({
    userId,
    stripeSubscriptionId: subscription.id,
    tier,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  // Determine which product this subscription is for
  const product = subscription.metadata.product || 'velocity';
  const tierField = product === 'dashboard' ? 'dashboardTier' : 'velocityTier';
  const customerField = product === 'dashboard' ? 'stripeDashboardCustomerId' : 'stripeVelocityCustomerId';

  await db
    .update(users)
    .set({ [tierField]: tier, [customerField]: session.customer as string, updatedAt: new Date() } as any)
    .where(eq(users.id, userId));

  console.log(`Subscription created for user ${userId}: ${tier} (${product})`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscription.id),
  });

  if (!existing) return;

  const tier = subscription.metadata.tier || existing.tier;

  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      tier,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  const product = subscription.metadata.product || existing.product;
  const tierField = product === 'dashboard' ? 'dashboardTier' : 'velocityTier';

  await db
    .update(users)
    .set({ [tierField]: tier, updatedAt: new Date() } as any)
    .where(eq(users.id, existing.userId));
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscription.id),
  });

  if (!existing) return;

  await db
    .update(subscriptions)
    .set({ status: 'canceled', updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  // Downgrade to free
  const tierField = existing.product === 'dashboard' ? 'dashboardTier' : 'velocityTier';
  await db
    .update(users)
    .set({ [tierField]: 'free', updatedAt: new Date() } as any)
    .where(eq(users.id, existing.userId));

  console.log(`Subscription canceled for user ${existing.userId}`);
}

export default app;
