import { test, before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, collection } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-petvida-rules-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(process.cwd(), '../firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/user1'), {
      plan: 'free', planExpiresAt: '', petCount: 0, petLimit: 3, reminderLimitPerPet: 5,
    });
    await setDoc(doc(ctx.firestore(), 'pets/pet1'), {
      userId: 'user1', name: 'Rex', species: 'Cão', reminderCount: 0,
    });
  });
});

test('a user cannot alter their own plan field directly', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertFails(updateDoc(doc(db, 'users/user1'), { plan: 'pro' }));
});

test('a user cannot alter their own petCount/petLimit directly', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertFails(updateDoc(doc(db, 'users/user1'), { petCount: 999 }));
  await assertFails(updateDoc(doc(db, 'users/user1'), { petLimit: -1 }));
});

test('a user CAN update unrelated profile fields on their own doc', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertSucceeds(updateDoc(doc(db, 'users/user1'), { phone: '11999999999' }));
});

test('a user cannot create a pet document directly — must go through the createPet Callable Function', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertFails(setDoc(doc(collection(db, 'pets')), { userId: 'user1', name: 'Sneaky', species: 'Cão' }));
});

test('a user cannot delete a pet document directly — must go through deletePet', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  const { deleteDoc } = await import('firebase/firestore');
  await assertFails(deleteDoc(doc(db, 'pets/pet1')));
});

test('a user cannot create a reminder document directly', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertFails(setDoc(doc(collection(db, 'reminders')), { userId: 'user1', petId: 'pet1', title: 'x', type: 'other', date: '2026-08-01', completed: false }));
});

test('a user CAN still edit their own pet\'s regular fields', async () => {
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertSucceeds(updateDoc(doc(db, 'pets/pet1'), { name: 'Rex Jr.' }));
});

test('a user cannot read another user\'s profile', async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/user2'), { plan: 'free', planExpiresAt: '' });
  });
  const db = testEnv.authenticatedContext('user1').firestore();
  await assertFails(getDoc(doc(db, 'users/user2')));
});

test('an admin custom claim can read and update another user\'s plan', async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/user2'), { plan: 'free', planExpiresAt: '' });
  });
  const adminDb = testEnv.authenticatedContext('admin-uid', { admin: true }).firestore();
  await assertSucceeds(getDoc(doc(adminDb, 'users/user2')));
  await assertSucceeds(updateDoc(doc(adminDb, 'users/user2'), { plan: 'pro', planExpiresAt: '2026-12-01' }));
});

test('a non-admin authenticated user cannot use admin-only escalation', async () => {
  const db = testEnv.authenticatedContext('user1', { admin: false }).firestore();
  await assertFails(updateDoc(doc(db, 'users/user1'), { plan: 'pro' }));
});

test('unauthenticated requests are denied entirely (fail closed)', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'users/user1')));
  await assertFails(setDoc(doc(collection(db, 'pets')), { userId: 'user1', name: 'X', species: 'Cão' }));
});
