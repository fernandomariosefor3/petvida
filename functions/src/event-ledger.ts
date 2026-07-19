import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const STALE_PROCESSING_MS = 5 * 60 * 1000; // 5 minutes

export class EventAlreadyProcessedError extends Error {
  constructor(eventId: string) {
    super(`Event ${eventId} already processed successfully — skipping.`);
    this.name = 'EventAlreadyProcessedError';
  }
}

export class EventInFlightError extends Error {
  constructor(eventId: string) {
    super(`Event ${eventId} is currently being processed by another invocation — skipping.`);
    this.name = 'EventInFlightError';
  }
}

/**
 * Atomically claims the right to process `eventId` in `stripeEvents/{eventId}`,
 * before any irreversible effect runs. Guarantees a given Stripe event is
 * only ever fully processed once, even if Stripe redelivers it concurrently:
 *
 * - Doesn't exist yet -> create it as 'processing', caller proceeds.
 * - status 'succeeded' -> throws EventAlreadyProcessedError (true no-op).
 * - status 'processing' and recent -> throws EventInFlightError (another
 *   invocation owns it right now).
 * - status 'processing' but stale (crashed invocation), or 'failed' -> resets
 *   to 'processing' and the caller retries the effect.
 */
export async function claimEvent(eventId: string, eventType: string): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(`stripeEvents/${eventId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = snap.data()!;
      if (data.status === 'succeeded') throw new EventAlreadyProcessedError(eventId);
      if (data.status === 'processing') {
        const startedAtMs = (data.startedAt as Timestamp | undefined)?.toMillis() ?? 0;
        if (Date.now() - startedAtMs < STALE_PROCESSING_MS) throw new EventInFlightError(eventId);
      }
      tx.set(ref, { status: 'processing', type: eventType, startedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    tx.create(ref, { status: 'processing', type: eventType, startedAt: FieldValue.serverTimestamp() });
  });
}

export async function markEventSucceeded(eventId: string): Promise<void> {
  await getFirestore()
    .doc(`stripeEvents/${eventId}`)
    .set({ status: 'succeeded', completedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function markEventFailed(eventId: string, error: unknown): Promise<void> {
  await getFirestore()
    .doc(`stripeEvents/${eventId}`)
    .set(
      {
        status: 'failed',
        completedAt: FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : String(error),
      },
      { merge: true }
    );
}
