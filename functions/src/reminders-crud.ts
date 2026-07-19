import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';

export const UNLIMITED = -1;
const DEFAULT_REMINDER_LIMIT_PER_PET = 5; // fail-closed default, matches the free tier

const REMINDER_TYPES = new Set(['vaccine', 'appointment', 'medication', 'grooming', 'other']);

export interface ReminderInput {
  petId: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  notes?: string;
}

function sanitizeReminderInput(raw: unknown): ReminderInput {
  const data = (raw ?? {}) as Record<string, unknown>;
  if (typeof data.petId !== 'string' || !data.petId) {
    throw new HttpsError('invalid-argument', 'petId é obrigatório.');
  }
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new HttpsError('invalid-argument', 'Título do lembrete é obrigatório.');
  }
  if (typeof data.type !== 'string' || !REMINDER_TYPES.has(data.type)) {
    throw new HttpsError('invalid-argument', 'Tipo de lembrete inválido.');
  }
  if (typeof data.date !== 'string' || !data.date) {
    throw new HttpsError('invalid-argument', 'Data do lembrete é obrigatória.');
  }
  return {
    petId: data.petId,
    title: data.title,
    type: data.type,
    date: data.date,
    time: typeof data.time === 'string' ? data.time : '',
    notes: typeof data.notes === 'string' ? data.notes : '',
  };
}

/**
 * Creates a reminder and increments the pet's reminderCount atomically:
 * reads the owner's plan-derived per-pet limit and the pet's current count
 * inside one transaction, validates ownership and quota, then writes both
 * documents together. Concurrent creates are serialized by Firestore's
 * transaction retry-on-conflict.
 */
export async function createReminderTransaction(db: Firestore, uid: string, rawInput: unknown): Promise<{ id: string }> {
  const input = sanitizeReminderInput(rawInput);
  const petRef = db.doc(`pets/${input.petId}`);
  const userRef = db.doc(`users/${uid}`);
  const reminderRef = db.collection('reminders').doc();

  await db.runTransaction(async (tx) => {
    const [petSnap, userSnap] = await Promise.all([tx.get(petRef), tx.get(userRef)]);

    if (!petSnap.exists) throw new HttpsError('not-found', 'Pet não encontrado.');
    if (petSnap.data()!.userId !== uid) throw new HttpsError('permission-denied', 'Você não é dono deste pet.');

    const userData = userSnap.data() ?? {};
    const reminderLimit = typeof userData.reminderLimitPerPet === 'number'
      ? userData.reminderLimitPerPet
      : DEFAULT_REMINDER_LIMIT_PER_PET;
    const reminderCount = typeof petSnap.data()!.reminderCount === 'number' ? (petSnap.data()!.reminderCount as number) : 0;

    if (reminderLimit !== UNLIMITED && reminderCount >= reminderLimit) {
      throw new HttpsError('resource-exhausted', 'Limite de lembretes deste pet atingido.');
    }

    tx.set(reminderRef, {
      ...input,
      userId: uid,
      completed: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(petRef, { reminderCount: reminderCount + 1 }, { merge: true });
  });

  return { id: reminderRef.id };
}

/** Deletes a reminder and decrements the pet's reminderCount atomically, clamped at zero. */
export async function deleteReminderTransaction(db: Firestore, uid: string, reminderId: string): Promise<void> {
  const reminderRef = db.doc(`reminders/${reminderId}`);

  await db.runTransaction(async (tx) => {
    const reminderSnap = await tx.get(reminderRef);
    if (!reminderSnap.exists) throw new HttpsError('not-found', 'Lembrete não encontrado.');
    if (reminderSnap.data()!.userId !== uid) throw new HttpsError('permission-denied', 'Você não é dono deste lembrete.');

    const petRef = db.doc(`pets/${reminderSnap.data()!.petId}`);
    const petSnap = await tx.get(petRef);

    tx.delete(reminderRef);
    if (petSnap.exists) {
      const currentCount = typeof petSnap.data()?.reminderCount === 'number' ? (petSnap.data()!.reminderCount as number) : 0;
      tx.set(petRef, { reminderCount: Math.max(0, currentCount - 1) }, { merge: true });
    }
  });
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');
  return request.auth.uid;
}

export const createReminder = onCall(async (request) => {
  const uid = requireAuth(request);
  return createReminderTransaction(getFirestore(), uid, request.data);
});

export const deleteReminder = onCall(async (request) => {
  const uid = requireAuth(request);
  const reminderId = request.data?.reminderId;
  if (typeof reminderId !== 'string' || !reminderId) {
    throw new HttpsError('invalid-argument', 'reminderId é obrigatório.');
  }
  await deleteReminderTransaction(getFirestore(), uid, reminderId);
  return { success: true };
});
