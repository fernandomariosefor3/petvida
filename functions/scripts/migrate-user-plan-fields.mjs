// One-time backfill for existing users/pets created before the plan-limits
// enforcement was added. Populates users/{id}.petCount/petLimit/reminderLimitPerPet
// and pets/{id}.reminderCount so firestore.rules can enforce quotas immediately.
//
// Run AFTER seed-plans.mjs, from inside functions/ after `npm install`:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json node scripts/migrate-user-plan-fields.mjs

import admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const plansSnap = await db.collection('plans').get();
const plansById = Object.fromEntries(plansSnap.docs.map((d) => [d.id, d.data()]));

const petsSnap = await db.collection('pets').get();
const petCountByUser = new Map();
const petsByUser = new Map();
for (const doc of petsSnap.docs) {
  const { userId } = doc.data();
  if (!userId) continue;
  petCountByUser.set(userId, (petCountByUser.get(userId) ?? 0) + 1);
  if (!petsByUser.has(userId)) petsByUser.set(userId, []);
  petsByUser.get(userId).push(doc.id);
}

const remindersSnap = await db.collection('reminders').get();
const reminderCountByPet = new Map();
for (const doc of remindersSnap.docs) {
  const { petId } = doc.data();
  if (!petId) continue;
  reminderCountByPet.set(petId, (reminderCountByPet.get(petId) ?? 0) + 1);
}

const usersSnap = await db.collection('users').get();
let batch = db.batch();
let opsInBatch = 0;

async function commitIfFull() {
  if (opsInBatch >= 400) {
    await batch.commit();
    batch = db.batch();
    opsInBatch = 0;
  }
}

for (const doc of usersSnap.docs) {
  const data = doc.data();
  const planId = data.plan || 'free';
  const plan = plansById[planId] ?? plansById.free ?? { maxPets: 3, maxRemindersPerPet: 5 };
  batch.set(
    doc.ref,
    {
      petCount: petCountByUser.get(doc.id) ?? 0,
      petLimit: plan.maxPets,
      reminderLimitPerPet: plan.maxRemindersPerPet,
    },
    { merge: true }
  );
  opsInBatch++;
  await commitIfFull();
}

for (const petId of reminderCountByPet.keys()) {
  batch.set(db.doc(`pets/${petId}`), { reminderCount: reminderCountByPet.get(petId) }, { merge: true });
  opsInBatch++;
  await commitIfFull();
}
// Pets with zero reminders never appear in reminderCountByPet — backfill them too.
for (const doc of petsSnap.docs) {
  if (reminderCountByPet.has(doc.id)) continue;
  batch.set(doc.ref, { reminderCount: 0 }, { merge: true });
  opsInBatch++;
  await commitIfFull();
}

if (opsInBatch > 0) await batch.commit();

console.log(`Migrated ${usersSnap.size} users and ${petsSnap.size} pets.`);
process.exit(0);
