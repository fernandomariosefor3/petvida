import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// TODO: replace with the real Price ID once the "PetVida Pro" product/price is
// created in the Stripe Dashboard (Products -> New -> recurring price).
const PRO_PRICE_ID = 'price_REPLACE_WITH_PRO_PRICE_ID';
const PREMIUM_PRICE_ID = 'price_1Toj7sFrgUEtY7Q61txvmvoN';
const SITE_URL = 'https://petvida.net.br';

const PLAN_PRICE_IDS: Record<string, string> = {
  pro: PRO_PRICE_ID,
  premium: PREMIUM_PRICE_ID,
};
const PRICE_ID_TO_PLAN: Record<string, string> = {
  [PRO_PRICE_ID]: 'pro',
  [PREMIUM_PRICE_ID]: 'premium',
};

export const createCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário para assinar um plano.');
  }

  const requestedPlan = (request.data?.plan as string) ?? 'premium';
  const priceId = PLAN_PRICE_IDS[requestedPlan];
  if (!priceId) {
    throw new HttpsError('invalid-argument', 'Plano inválido.');
  }

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

  const db = getFirestore();

  function resolvePlan(subscription: Stripe.Subscription): string {
    const metaPlan = subscription.metadata?.plan;
    if (metaPlan && (metaPlan === 'pro' || metaPlan === 'premium')) return metaPlan;
    const priceId = subscription.items.data[0]?.price?.id;
    return (priceId && PRICE_ID_TO_PLAN[priceId]) || 'premium';
  }

  async function setPlanFromSubscription(userId: string, subscriptionId: string) {
    const stripeClient = new Stripe(stripeSecretKey.value());
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    const periodEnd = new Date(subscription.items.data[0].current_period_end * 1000);
    await db.doc(`users/${userId}`).set(
      {
        plan: resolvePlan(subscription),
        planExpiresAt: periodEnd.toISOString().split('T')[0],
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscriptionId,
        paymentFailedAt: FieldValue.delete(),
      },
      { merge: true }
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      if (userId && session.subscription) {
        await setPlanFromSubscription(userId, session.subscription as string);
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
      if (subscriptionId) {
        const stripeClient = new Stripe(stripeSecretKey.value());
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        if (userId) await setPlanFromSubscription(userId, subscriptionId);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await db.doc(`users/${userId}`).set(
          { plan: 'free', planExpiresAt: '', paymentFailedAt: FieldValue.delete() },
          { merge: true }
        );
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
      if (subscriptionId) {
        const stripeClient = new Stripe(stripeSecretKey.value());
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        if (userId) {
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
  }

  res.status(200).send({ received: true });
});
