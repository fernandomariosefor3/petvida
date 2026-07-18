import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();
const db = admin.firestore();

// Inicializar Stripe (usar secret do environment)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Cria sessão de checkout do Stripe
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { priceId, userEmail, successUrl, cancelUrl } = data;
  const userId = context.auth.uid;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao criar sessão de checkout');
  }
});

/**
 * Recupera detalhes da sessão de checkout
 */
export const getCheckoutSession = functions.https.onRequest(async (req, res) => {
  // Apenas GET
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    res.status(400).json({ error: 'session_id é obrigatório' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      subscriptionId: session.subscription,
      customerId: session.customer,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
    res.status(500).json({ error: 'Erro ao buscar sessão' });
  }
});

/**
 * Cria sessão do Customer Portal para gerenciar assinatura
 */
export const createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { customerId } = data;
  const userId = context.auth.uid;

  // Verificar se o customerId pertence ao usuário
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData || userData.customerId !== customerId) {
    throw new functions.https.HttpsError('permission-denied', 'Customer não pertence ao usuário');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.SITE_URL}/planos`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erro ao criar portal:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao criar sessão do portal');
  }
});

/**
 * Webhook do Stripe para processar eventos
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers.signature as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send('Webhook Error');
    return;
  }

  // Processar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status === 'paid') {
          const userId = session.metadata?.userId;
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          if (userId) {
            // Buscar detalhes da assinatura para pegar data de expiração
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const currentPeriodEnd = subscription.current_period_end;

            // Atualizar usuário no Firestore
            await db.collection('users').doc(userId).update({
              plan: 'premium',
              planExpiresAt: new Date(currentPeriodEnd * 1000).toISOString(),
              subscriptionId,
              customerId,
              planUpgradedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Plano premium ativado para usuário ${userId}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Atualizar data de expiração
        if (subscription.status === 'active') {
          const usersSnapshot = await db
            .collection('users')
            .where('customerId', '==', customerId)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              planExpiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
              subscriptionId: subscription.id,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Rebaixar para plano free
        const usersSnapshot = await db
          .collection('users')
          .where('customerId', '==', customerId)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            plan: 'free',
            planExpiresAt: '',
            subscriptionId: admin.firestore.FieldValue.delete(),
            customerId: admin.firestore.FieldValue.delete(),
            planDowngradedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Assinatura cancelada para customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Encontrar usuário e enviar notificação (futuro: e-mail)
        console.log(`Pagamento falhou para customer ${customerId}`);

        // Opcional: atualizar status no Firestore
        const usersSnapshot = await db
          .collection('users')
          .where('customerId', '==', customerId)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar evento' });
  }
});

/**
 * Função agendada para verificar assinaturas expiradas
 * Roda todo dia às 6h
 */
export const checkExpiredSubscriptions = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const now = new Date();

    // Buscar usuários com plano premium expirado
    const expiredUsers = await db
      .collection('users')
      .where('plan', '==', 'premium')
      .where('planExpiresAt', '<', now.toISOString())
      .get();

    const updates = expiredUsers.docs.map((doc) =>
      doc.ref.update({
        plan: 'free',
        planExpiresAt: '',
        subscriptionId: admin.firestore.FieldValue.delete(),
        customerId: admin.firestore.FieldValue.delete(),
        planExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    );

    await Promise.all(updates);
    console.log(`Verificadas ${expiredUsers.size} assinaturas expiradas`);

    return null;
  });
