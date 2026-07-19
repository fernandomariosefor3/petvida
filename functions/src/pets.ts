import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';

export const UNLIMITED = -1;
const DEFAULT_PET_LIMIT = 3; // fail-closed: if petLimit is missing, assume the most restrictive (free) tier

export interface PetInput {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  weight?: number;
  color?: string;
  gender?: 'male' | 'female';
  photo?: string;
  microchip?: string;
  neutered?: boolean;
  bloodType?: string;
  allergies?: string;
  notes?: string;
}

const STRING_FIELDS = ['name', 'species', 'breed', 'birthDate', 'color', 'photo', 'microchip', 'bloodType', 'allergies', 'notes'] as const;

/** Strips anything the client sends beyond the known pet fields — userId, counters, id, createdAt are never client-controlled. */
function sanitizePetInput(raw: unknown): PetInput {
  const data = (raw ?? {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const field of STRING_FIELDS) {
    if (typeof data[field] === 'string') result[field] = data[field];
  }
  if (typeof data.weight === 'number') result.weight = data.weight;
  if (data.gender === 'male' || data.gender === 'female') result.gender = data.gender;
  if (typeof data.neutered === 'boolean') result.neutered = data.neutered;

  const name = result.name;
  const species = result.species;
  if (typeof name !== 'string' || !name.trim()) {
    throw new HttpsError('invalid-argument', 'Nome do pet é obrigatório.');
  }
  if (typeof species !== 'string' || !species.trim()) {
    throw new HttpsError('invalid-argument', 'Espécie do pet é obrigatória.');
  }
  return { ...result, name, species };
}

/**
 * Creates a pet and increments the owner's petCount atomically in a single
 * Firestore transaction: reads the user's plan-derived limit and current
 * count, validates, then writes the pet doc and the incremented counter
 * together. Concurrent calls are serialized by Firestore's transaction
 * retry-on-conflict, so two simultaneous requests can never both succeed
 * past the limit.
 */
export async function createPetTransaction(db: Firestore, uid: string, rawInput: unknown): Promise<{ id: string }> {
  const petData = sanitizePetInput(rawInput);
  const petRef = db.collection('pets').doc();
  const userRef = db.doc(`users/${uid}`);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('failed-precondition', 'Perfil de usuário não encontrado.');
    }
    const userData = userSnap.data()!;
    const petLimit = typeof userData.petLimit === 'number' ? userData.petLimit : DEFAULT_PET_LIMIT;
    const petCount = typeof userData.petCount === 'number' ? userData.petCount : 0;

    if (petLimit !== UNLIMITED && petCount >= petLimit) {
      throw new HttpsError('resource-exhausted', 'Limite de pets do seu plano atingido.');
    }

    tx.set(petRef, {
      ...petData,
      userId: uid,
      reminderCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(userRef, { petCount: petCount + 1 }, { merge: true });
  });

  return { id: petRef.id };
}

/**
 * Deletes a pet and decrements the owner's petCount atomically, clamped at
 * zero. Cascade-deletes reminders/health records for the pet afterwards
 * (not inside the transaction — could exceed Firestore's per-transaction
 * write cap for pets with many records).
 */
export async function deletePetTransaction(db: Firestore, uid: string, petId: string): Promise<void> {
  const petRef = db.doc(`pets/${petId}`);
  const userRef = db.doc(`users/${uid}`);

  await db.runTransaction(async (tx) => {
    const petSnap = await tx.get(petRef);
    if (!petSnap.exists) {
      throw new HttpsError('not-found', 'Pet não encontrado.');
    }
    if (petSnap.data()!.userId !== uid) {
      throw new HttpsError('permission-denied', 'Você não é dono deste pet.');
    }

    const userSnap = await tx.get(userRef);
    const currentCount = typeof userSnap.data()?.petCount === 'number' ? (userSnap.data()!.petCount as number) : 0;

    tx.delete(petRef);
    tx.set(userRef, { petCount: Math.max(0, currentCount - 1) }, { merge: true });
  });

  const [remindersSnap, healthSnap] = await Promise.all([
    db.collection('reminders').where('petId', '==', petId).get(),
    db.collection('healthRecords').where('petId', '==', petId).get(),
  ]);
  if (remindersSnap.empty && healthSnap.empty) return;

  const batch = db.batch();
  remindersSnap.forEach((d) => batch.delete(d.ref));
  healthSnap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

function requireAuth(request: { auth?: { uid: string } | null }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');
  return request.auth.uid;
}

export const createPet = onCall(async (request) => {
  const uid = requireAuth(request);
  return createPetTransaction(getFirestore(), uid, request.data);
});

export const deletePet = onCall(async (request) => {
  const uid = requireAuth(request);
  const petId = request.data?.petId;
  if (typeof petId !== 'string' || !petId) {
    throw new HttpsError('invalid-argument', 'petId é obrigatório.');
  }
  await deletePetTransaction(getFirestore(), uid, petId);
  return { success: true };
});
