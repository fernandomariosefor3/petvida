import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type Stripe from 'stripe';
import { getPriceIdToPlan } from './config.js';
import { resolvePlanFromPriceId } from './plan-resolution.js';

export { UnknownPriceIdError } from './plan-resolution.js';

const GRANTS_ACCESS = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due', 'unpaid', 'incomplete']);
const IS_PAST_DUE = new Set<Stripe.Subscription.Status>(['past_due', 'unpaid', 'incomplete']);

export interface SubscriptionSyncResult {
  userId: string;
  plan: 'free' | 'pro';
  status: Stripe.Subscription.Status;
}

/**
 * Single source of truth for turning a Stripe subscription object into the
 * user's plan state in Firestore. Every webhook event that touches
 * subscription state goes through this, so status/price/period/cancellation
 * logic only lives in one place instead of being duplicated per event type.
 *
 * Throws UnknownPriceIdError (via resolvePlanFromPriceId) when the
 * subscription's price doesn't map to a known plan and the subscription is
 * in a state that would otherwise grant access — the caller must NOT catch
 * this to fall back to a default plan; let it propagate so the webhook
 * handler records the failure and returns non-2xx for Stripe to retry.
 */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<SubscriptionSyncResult> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    throw new Error(`Subscription ${subscription.id} has no userId in metadata — cannot sync.`);
  }

  const db = getFirestore();
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;
  const periodEnd = new Date(subscription.items.data[0].current_period_end * 1000);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;

  const update: Record<string, unknown> = {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: status,
    cancelAtPeriodEnd,
  };

  let plan: SubscriptionSyncResult['plan'];

  if (GRANTS_ACCESS.has(status)) {
    // Resolving the plan can throw UnknownPriceIdError — deliberately left
    // uncaught so no plan is ever written when the price is unrecognized.
    plan = resolvePlanFromPriceId(priceId, getPriceIdToPlan());
    update.plan = plan;
    update.planExpiresAt = periodEnd.toISOString().split('T')[0];
    update.paymentFailedAt = IS_PAST_DUE.has(status) ? FieldValue.serverTimestamp() : FieldValue.delete();
  } else {
    // canceled, incomplete_expired, paused — subscription no longer grants access.
    plan = 'free';
    update.plan = 'free';
    update.planExpiresAt = '';
    update.paymentFailedAt = FieldValue.delete();
  }

  await db.doc(`users/${userId}`).set(update, { merge: true });

  return { userId, plan, status };
}

/**
 * customer.subscription.deleted specifically: the subscription object is
 * already gone/terminal, so there's no price to resolve — always downgrades
 * to free. Kept separate from syncSubscription so a deletion can never be
 * blocked by an unresolvable price ID.
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{ userId: string }> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    throw new Error(`Subscription ${subscription.id} has no userId in metadata — cannot process deletion.`);
  }
  const db = getFirestore();
  await db.doc(`users/${userId}`).set(
    {
      plan: 'free',
      planExpiresAt: '',
      subscriptionStatus: 'canceled',
      cancelAtPeriodEnd: false,
      paymentFailedAt: FieldValue.delete(),
    },
    { merge: true }
  );
  return { userId };
}
