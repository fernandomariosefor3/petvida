import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const SITE_URL = 'https://petvida.net.br';
const GRACE_PERIOD_DAYS = 7;

async function getStripeCustomerId(userId: string): Promise<string> {
  const snap = await getFirestore().doc(`users/${userId}`).get();
  const customerId = snap.data()?.stripeCustomerId as string | undefined;
  if (!customerId) {
    throw new HttpsError('failed-precondition', 'Você ainda não tem uma assinatura via cartão.');
  }
  return customerId;
}

export const createPortalSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }
  const customerId = await getStripeCustomerId(request.auth.uid);
  const stripe = new Stripe(stripeSecretKey.value());
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/billing`,
  });
  return { url: session.url };
});

export const listInvoices = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login necessário.');
  }
  const customerId = await getStripeCustomerId(request.auth.uid);
  const stripe = new Stripe(stripeSecretKey.value());
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
  return {
    invoices: invoices.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      amount: inv.amount_paid,
      status: inv.status,
      pdfUrl: inv.invoice_pdf ?? null,
    })),
  };
});

// Daily check: if a subscription has been failing payment for more than
// GRACE_PERIOD_DAYS with no successful renewal, downgrade to free but keep
// all pet/reminder/health data intact (per US-006 in the v2 roadmap).
export const downgradeOverduePayments = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'America/Fortaleza' },
  async () => {
    const db = getFirestore();
    const cutoff = Timestamp.fromMillis(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const snap = await db.collection('users').where('paymentFailedAt', '<=', cutoff).get();

    await Promise.all(
      snap.docs.map((doc) =>
        doc.ref.set(
          { plan: 'free', planExpiresAt: '', paymentFailedAt: FieldValue.delete() },
          { merge: true }
        )
      )
    );
  }
);
