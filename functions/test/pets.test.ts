import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getTestDb, clearFirestore } from './helpers.js';
import { createPetTransaction, deletePetTransaction, UNLIMITED } from '../src/pets.js';

const db = getTestDb();

beforeEach(async () => {
  await clearFirestore();
});

async function seedUser(uid: string, petLimit: number, petCount = 0) {
  await db.doc(`users/${uid}`).set({ petLimit, petCount });
}

test('free plan: can create pets up to the limit', async () => {
  await seedUser('user1', 3);
  await createPetTransaction(db, 'user1', { name: 'Rex', species: 'Cão' });
  await createPetTransaction(db, 'user1', { name: 'Miau', species: 'Gato' });
  await createPetTransaction(db, 'user1', { name: 'Piu', species: 'Pássaro' });

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.petCount, 3);
});

test('a 4th pet is blocked once the free-plan limit is reached', async () => {
  await seedUser('user1', 3, 3);
  await assert.rejects(
    () => createPetTransaction(db, 'user1', { name: 'Extra', species: 'Cão' }),
    (err: unknown) => (err as { code?: string }).code === 'resource-exhausted'
  );
});

test('two concurrent creations never exceed a limit of 1', async () => {
  await seedUser('user1', 1);
  const attempts = await Promise.allSettled([
    createPetTransaction(db, 'user1', { name: 'A', species: 'Cão' }),
    createPetTransaction(db, 'user1', { name: 'B', species: 'Cão' }),
  ]);

  const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
  assert.equal(fulfilled.length, 1, 'exactly one of the two concurrent creates should succeed');

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.petCount, 1);

  const petsSnap = await db.collection('pets').where('userId', '==', 'user1').get();
  assert.equal(petsSnap.size, 1);
});

test('premium (unlimited) plan can create many pets', async () => {
  await seedUser('user1', UNLIMITED);
  for (let i = 0; i < 5; i++) {
    await createPetTransaction(db, 'user1', { name: `Pet${i}`, species: 'Cão' });
  }
  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.petCount, 5);
});

test('deleting a pet decrements the counter', async () => {
  await seedUser('user1', 3);
  const { id } = await createPetTransaction(db, 'user1', { name: 'Rex', species: 'Cão' });
  await deletePetTransaction(db, 'user1', id);

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.petCount, 0);
});

test('counter never goes negative, even deleting a pet that was never counted', async () => {
  await seedUser('user1', 3, 0);
  // Simulate drift: a pet doc that exists without ever incrementing petCount.
  const ref = db.collection('pets').doc();
  await ref.set({ userId: 'user1', name: 'Stray', species: 'Cão', reminderCount: 0 });

  await deletePetTransaction(db, 'user1', ref.id);

  const snap = await db.doc('users/user1').get();
  assert.equal(snap.data()?.petCount, 0);
});

test('deletePetTransaction rejects when the caller does not own the pet', async () => {
  await seedUser('owner', 3);
  const { id } = await createPetTransaction(db, 'owner', { name: 'Rex', species: 'Cão' });

  await assert.rejects(
    () => deletePetTransaction(db, 'someone-else', id),
    (err: unknown) => (err as { code?: string }).code === 'permission-denied'
  );
});

test('createPetTransaction fails closed when the user profile is missing', async () => {
  await assert.rejects(
    () => createPetTransaction(db, 'ghost-user', { name: 'Rex', species: 'Cão' }),
    (err: unknown) => (err as { code?: string }).code === 'failed-precondition'
  );
});

test('createPetTransaction defaults to the free limit (3) when petLimit is missing — fails closed, not open', async () => {
  await db.doc('users/user1').set({}); // no petLimit field at all
  await createPetTransaction(db, 'user1', { name: 'A', species: 'Cão' });
  await createPetTransaction(db, 'user1', { name: 'B', species: 'Cão' });
  await createPetTransaction(db, 'user1', { name: 'C', species: 'Cão' });
  await assert.rejects(
    () => createPetTransaction(db, 'user1', { name: 'D', species: 'Cão' }),
    (err: unknown) => (err as { code?: string }).code === 'resource-exhausted'
  );
});
