import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import Stripe from 'stripe';
import { stripeSecretKey, stripeWebhookSecret, getPlanPriceIds, type PayingPlan } from './config.js';
import { syncSubscription, handleSubscriptionDeleted, UnknownPriceIdError } from './subscription-sync.js';
import { claimEvent, markEventSucceeded, markEventFailed, EventAlreadyProcessedError, EventInFlightError } from './event-ledger.js';

const SITE_URL = 'https://petvida.net.br';

function isPayingPlan(value: unknown): value is PayingPlan {
  return value === 'pro' || value === 'premium';
}

export const createCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário para assinar um plano.');
  }

  const requestedPlan = request.data?.plan;
  if (!isPayingPlan(requestedPlan)) {
    throw new HttpsError('invalid-argument', 'Plano inválido.');
  }

  const priceIds = getPlanPriceIds(); // throws HttpsError-worthy config error if unset — see catch below
  const priceId = priceIds[requestedPlan];

  const stripe = new Stripe(stripeSecretKey.value());
  const userId = request.auth.uid;
  const email = request.auth.token.email;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: userId,
    customer_email: email,
    metadata: { userId, plan: requestedPlan },
    subscription_data: { metadata: { userId, plan: requestedPlan } },
    success_url: `${SITE_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/planos`,
  });

  return { url: session.url };
});

export const stripeWebhook = onRequest({ secrets: [stripeSecretKey, stripeWebhookSecret] }, async (req, res) => {
  const stripe = new Stripe(stripeSecretKey.value());
  const signature = req.headers['stripe-signature'];

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, signature as string, stripeWebhookSecret.value());
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
    return;
  }

  try {
    await claimEvent(event.id, event.type);
  } catch (err) {
    if (err instanceof EventAlreadyProcessedError || err instanceof EventInFlightError) {
      res.status(200).send({ received: true, deduped: true });
      return;
    }
    logger.error('Failed to claim Stripe event for idempotent processing', { eventId: event.id, error: err });
    res.status(500).send({ error: 'ledger_error' });
    return;
  }

  try {
    await processStripeEvent(event, stripe);
    await markEventSucceeded(event.id);
    res.status(200).send({ received: true });
  } catch (err) {
    await markEventFailed(event.id, err);
    logger.error('Stripe webhook event processing failed', {
      eventId: event.id,
      type: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    // Non-2xx tells Stripe to retry — critical for UnknownPriceIdError and
    // any transient failure, since we never want to silently drop an event.
    res.status(500).send({ error: 'processing_failed' });
  }
});

async function processStripeEvent(event: Stripe.Event, stripe: Stripe): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscription(subscription);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        if (userId) {
          const db = getFirestore();
          const userRef = db.doc(`users/${userId}`);
          const userSnap = await userRef.get();
          // Only stamp the first failure in a streak, so the 7-day grace
          // period (see billing.ts) is measured from the initial failure,
          // not reset on every Stripe retry attempt.
          if (!userSnap.data()?.paymentFailedAt) {
            await userRef.set({ paymentFailedAt: FieldValue.serverTimestamp() }, { merge: true });
          }
          await db.collection('paymentEvents').add({
            userId,
            type: 'payment_failed',
            subscriptionId,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }
      break;
    }

    default:
      // Unhandled event types are acknowledged (marked succeeded) without
      // side effects — Stripe sends many event types we don't act on.
      break;
  }
}

// Re-exported for tests and for anything downstream that needs to
// distinguish "unrecognized price" from other processing failures.
export { UnknownPriceIdError };
