import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getTestDb, clearFirestore } from './helpers.js';
import { createReminderTransaction, deleteReminderTransaction } from '../src/reminders-crud.js';
import { UNLIMITED } from '../src/pets.js';

const db = getTestDb();

beforeEach(async () => {
  await clearFirestore();
});

async function seedUserAndPet(uid: string, petId: string, reminderLimitPerPet: number, reminderCount = 0) {
  await db.doc(`users/${uid}`).set({ reminderLimitPerPet });
  await db.doc(`pets/${petId}`).set({ userId: uid, name: 'Rex', species: 'Cão', reminderCount });
}

test('reminders respect the per-pet limit', async () => {
  await seedUserAndPet('user1', 'pet1', 2);
  await createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'Vacina', type: 'vaccine', date: '2026-08-01' });
  await createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'Consulta', type: 'appointment', date: '2026-08-02' });

  await assert.rejects(
    () => createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'Extra', type: 'other', date: '2026-08-03' }),
    (err: unknown) => (err as { code?: string }).code === 'resource-exhausted'
  );

  const petSnap = await db.doc('pets/pet1').get();
  assert.equal(petSnap.data()?.reminderCount, 2);
});

test('unlimited (-1) reminder limit allows any number of reminders', async () => {
  await seedUserAndPet('user1', 'pet1', UNLIMITED);
  for (let i = 0; i < 10; i++) {
    await createReminderTransaction(db, 'user1', { petId: 'pet1', title: `R${i}`, type: 'other', date: '2026-08-01' });
  }
  const petSnap = await db.doc('pets/pet1').get();
  assert.equal(petSnap.data()?.reminderCount, 10);
});

test('createReminderTransaction rejects when the caller does not own the pet', async () => {
  await seedUserAndPet('owner', 'pet1', 5);
  await assert.rejects(
    () => createReminderTransaction(db, 'someone-else', { petId: 'pet1', title: 'X', type: 'other', date: '2026-08-01' }),
    (err: unknown) => (err as { code?: string }).code === 'permission-denied'
  );
});

test('deleting a reminder decrements the pet reminderCount, clamped at zero', async () => {
  await seedUserAndPet('user1', 'pet1', 5);
  const { id } = await createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'Vacina', type: 'vaccine', date: '2026-08-01' });
  await deleteReminderTransaction(db, 'user1', id);

  const petSnap = await db.doc('pets/pet1').get();
  assert.equal(petSnap.data()?.reminderCount, 0);

  // Deleting again (already deleted) should not push the count negative.
  await db.doc('pets/pet1').set({ reminderCount: 0 }, { merge: true });
  const secondRef = db.collection('reminders').doc();
  await secondRef.set({ userId: 'user1', petId: 'pet1', title: 'stray', type: 'other', date: '2026-08-01' });
  await deleteReminderTransaction(db, 'user1', secondRef.id);
  const petSnap2 = await db.doc('pets/pet1').get();
  assert.equal(petSnap2.data()?.reminderCount, 0);
});

test('two concurrent reminder creations never exceed a per-pet limit of 1', async () => {
  await seedUserAndPet('user1', 'pet1', 1);
  const attempts = await Promise.allSettled([
    createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'A', type: 'other', date: '2026-08-01' }),
    createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'B', type: 'other', date: '2026-08-01' }),
  ]);
  const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
  assert.equal(fulfilled.length, 1);

  const petSnap = await db.doc('pets/pet1').get();
  assert.equal(petSnap.data()?.reminderCount, 1);
});

test('createReminderTransaction defaults to the free limit (5) when reminderLimitPerPet is missing', async () => {
  await db.doc('users/user1').set({});
  await db.doc('pets/pet1').set({ userId: 'user1', name: 'Rex', species: 'Cão' }); // no reminderCount field either
  for (let i = 0; i < 5; i++) {
    await createReminderTransaction(db, 'user1', { petId: 'pet1', title: `R${i}`, type: 'other', date: '2026-08-01' });
  }
  await assert.rejects(
    () => createReminderTransaction(db, 'user1', { petId: 'pet1', title: 'Extra', type: 'other', date: '2026-08-01' }),
    (err: unknown) => (err as { code?: string }).code === 'resource-exhausted'
  );
});
