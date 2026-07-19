process.env.STRIPE_PRO_PRICE_ID = 'price_test_pro';
process.env.STRIPE_PREMIUM_PRICE_ID = 'price_test_premium';

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type Stripe from 'stripe';
import { getTestDb, clearFirestore } from './helpers.js';
import { syncSubscription, handleSubscriptionDeleted, UnknownPriceIdError } from '../src/subscription-sync.js';

const db = getTestDb();

beforeEach(async () => {
  await clearFirestore();
});

function fakeSubscription(overrides: Partial<{
  id: string; status: Stripe.Subscription.Status; priceId: string; userId: string;
  periodEnd: number; cancelAtPeriodEnd: boolean; customer: string;
}>): Stripe.Subscription {
  const {
    id = 'sub_123', status = 'active', priceId = 'price_test_pro', userId = 'user1',
    periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, cancelAtPeriodEnd = false, customer = 'cus_123',
  } = overrides;
  return {
    id,
    status,
    customer,
    cancel_at_period_end: cancelAtPeriodEnd,
    metadata: { userId },
    items: { data: [{ price: { id: priceId }, current_period_end: periodEnd }] },
  } as unknown as Stripe.Subscription;
}

test('active subscription with a known Pro price grants the pro plan', async () => {
  await db.doc('users/user1').set({ plan: 'free' });
  const result = await syncSubscription(fakeSubscription({ status: 'active', priceId: 'price_test_pro' }));
  assert.equal(result.plan, 'pro');

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'pro');
  assert.equal(snap.data()?.subscriptionStatus, 'active');
});

test('an unrecognized price ID throws and never writes a plan to the user doc', async () => {
  await db.doc('users/user1').set({ plan: 'free' });

  await assert.rejects(
    () => syncSubscription(fakeSubscription({ status: 'active', priceId: 'price_completely_unknown' })),
    UnknownPriceIdError
  );

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'free', 'plan must remain untouched after an unknown price ID');
});

test('switching from Pro to Premium price updates the plan on the next sync', async () => {
  await db.doc('users/user1').set({ plan: 'free' });
  await syncSubscription(fakeSubscription({ status: 'active', priceId: 'price_test_pro' }));
  let snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'pro');

  await syncSubscription(fakeSubscription({ status: 'active', priceId: 'price_test_premium' }));
  snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'premium');
});

test('past_due status keeps plan access but flags paymentFailedAt', async () => {
  await db.doc('users/user1').set({ plan: 'pro' });
  await syncSubscription(fakeSubscription({ status: 'past_due', priceId: 'price_test_pro' }));

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'pro');
  assert.ok(snap.data()?.paymentFailedAt, 'paymentFailedAt should be stamped while past due');
});

test('customer.subscription.deleted downgrades to free even without resolving a price', async () => {
  await db.doc('users/user1').set({ plan: 'premium', planExpiresAt: '2026-12-01' });
  await handleSubscriptionDeleted(fakeSubscription({ status: 'canceled' }));

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'free');
  assert.equal(snap.data()?.planExpiresAt, '');
  assert.equal(snap.data()?.subscriptionStatus, 'canceled');
});

test('a canceled status via syncSubscription also downgrades to free', async () => {
  await db.doc('users/user1').set({ plan: 'pro' });
  const result = await syncSubscription(fakeSubscription({ status: 'canceled', priceId: 'price_test_pro' }));
  assert.equal(result.plan, 'free');

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'free');
});

test('cancel_at_period_end is recorded so access can continue until the period ends', async () => {
  await db.doc('users/user1').set({ plan: 'pro' });
  await syncSubscription(fakeSubscription({ status: 'active', priceId: 'price_test_pro', cancelAtPeriodEnd: true }));

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.plan, 'pro', 'plan stays active until the period actually ends');
  assert.equal(snap.data()?.cancelAtPeriodEnd, true);
});
