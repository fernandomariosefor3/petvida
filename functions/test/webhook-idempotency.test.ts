import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
import { getTestDb, clearFirestore } from './helpers.js';
import { claimEvent, markEventSucceeded, markEventFailed, EventAlreadyProcessedError, EventInFlightError } from '../src/event-ledger.js';

const db = getTestDb();

beforeEach(async () => {
  await clearFirestore();
});

test('claiming a brand-new event succeeds and records it as processing', async () => {
  await claimEvent('evt_1', 'checkout.session.completed');
  const snap = await db.doc('stripeEvents/evt_1').get();
  assert.equal(snap.data()?.status, 'processing');
});

test('a duplicate delivery of an already-succeeded event is ignored (idempotent skip)', async () => {
  await claimEvent('evt_1', 'checkout.session.completed');
  await markEventSucceeded('evt_1');

  await assert.rejects(() => claimEvent('evt_1', 'checkout.session.completed'), EventAlreadyProcessedError);
});

test('a concurrent redelivery while still processing is treated as in-flight, not reprocessed', async () => {
  await claimEvent('evt_1', 'checkout.session.completed');
  // Still 'processing' and recent — a second claim right away must not proceed.
  await assert.rejects(() => claimEvent('evt_1', 'checkout.session.completed'), EventInFlightError);
});

test('a stale "processing" record (crashed invocation) is retried instead of stuck forever', async () => {
  await db.doc('stripeEvents/evt_1').set({
    status: 'processing',
    type: 'checkout.session.completed',
    startedAt: Timestamp.fromMillis(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  });

  await claimEvent('evt_1', 'checkout.session.completed'); // should not throw
  const snap = await db.doc('stripeEvents/evt_1').get();
  assert.equal(snap.data()?.status, 'processing');
});

test('a failed event can be retried on the next delivery', async () => {
  await claimEvent('evt_1', 'invoice.payment_failed');
  await markEventFailed('evt_1', new Error('boom'));

  await claimEvent('evt_1', 'invoice.payment_failed'); // should not throw — retry allowed
  const snap = await db.doc('stripeEvents/evt_1').get();
  assert.equal(snap.data()?.status, 'processing');
});

test('markEventFailed records the error message for later debugging', async () => {
  await claimEvent('evt_1', 'invoice.payment_failed');
  await markEventFailed('evt_1', new Error('unknown price id'));

  const snap = await db.doc('stripeEvents/evt_1').get();
  assert.equal(snap.data()?.status, 'failed');
  assert.match(snap.data()?.error ?? '', /unknown price id/);
});
