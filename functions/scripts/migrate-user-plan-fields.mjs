// Idempotent backfill for users/pets created before the plan-limits
// enforcement was added. Recomputes users/{id}.petCount/petLimit/
// reminderLimitPerPet and pets/{id}.reminderCount from the actual
// collections every run — safe to run more than once, never duplicates or
// double-counts, since each run overwrites with the freshly computed truth.
//
// Run AFTER seed-plans.mjs, from inside functions/ after `npm install`:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json \
//     node scripts/migrate-user-plan-fields.mjs --project petvid-82a98 [--dry-run] [--yes]

import admin from 'firebase-admin';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const hasFlag = (name) => args.includes(`--${name}`);

const projectId = flag('project');
const dryRun = hasFlag('dry-run');
const confirmed = hasFlag('yes') || dryRun;

if (!projectId) {
  console.error('Missing --project <firebase-project-id>. Refusing to run against an unspecified project.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });

const actualProjectId = admin.app().options.projectId;
if (actualProjectId !== projectId) {
  console.error(`Refusing to continue: credential resolves to project "${actualProjectId}", not "${projectId}".`);
  process.exit(1);
}

const db = admin.firestore();

const plansSnap = await db.collection('plans').get();
const plansById = Object.fromEntries(plansSnap.docs.map((d) => [d.id, d.data()]));

const petsSnap = await db.collection('pets').get();
const petCountByUser = new Map();
for (const doc of petsSnap.docs) {
  const { userId } = doc.data();
  if (!userId) continue;
  petCountByUser.set(userId, (petCountByUser.get(userId) ?? 0) + 1);
}

const remindersSnap = await db.collection('reminders').get();
const reminderCountByPet = new Map();
for (const doc of remindersSnap.docs) {
  const { petId } = doc.data();
  if (!petId) continue;
  reminderCountByPet.set(petId, (reminderCountByPet.get(petId) ?? 0) + 1);
}

const usersSnap = await db.collection('users').get();

const userUpdates = usersSnap.docs.map((doc) => {
  const data = doc.data();
  const planId = data.plan || 'free';
  const plan = plansById[planId] ?? plansById.free ?? { maxPets: 3, maxRemindersPerPet: 5 };
  return {
    ref: doc.ref,
    id: doc.id,
    petCount: petCountByUser.get(doc.id) ?? 0,
    petLimit: plan.maxPets,
    reminderLimitPerPet: plan.maxRemindersPerPet,
    changed: data.petCount !== (petCountByUser.get(doc.id) ?? 0)
      || data.petLimit !== plan.maxPets
      || data.reminderLimitPerPet !== plan.maxRemindersPerPet,
  };
});

const petUpdates = petsSnap.docs.map((doc) => {
  const truth = reminderCountByPet.get(doc.id) ?? 0;
  return { ref: doc.ref, id: doc.id, reminderCount: truth, changed: doc.data().reminderCount !== truth };
});

const usersToWrite = userUpdates.filter((u) => u.changed);
const petsToWrite = petUpdates.filter((p) => p.changed);

console.log(`Project: ${actualProjectId}`);
console.log(`Mode:    ${dryRun ? 'DRY RUN — no writes will be made' : 'WRITE'}`);
console.log(`Users:   ${usersSnap.size} total, ${usersToWrite.length} need updating`);
console.log(`Pets:    ${petsSnap.size} total, ${petsToWrite.length} need updating`);
if (usersToWrite.length > 0) {
  console.log('Sample user changes:');
  for (const u of usersToWrite.slice(0, 5)) {
    console.log(`  - users/${u.id}: petCount=${u.petCount} petLimit=${u.petLimit} reminderLimitPerPet=${u.reminderLimitPerPet}`);
  }
}

if (usersToWrite.length === 0 && petsToWrite.length === 0) {
  console.log('\nEverything already up to date — nothing to do.');
  process.exit(0);
}

if (!confirmed) {
  console.error('\nRefusing to write without --yes (or use --dry-run to preview only).');
  process.exit(1);
}

if (dryRun) {
  console.log('\nDry run complete — nothing was written.');
  process.exit(0);
}

let batch = db.batch();
let opsInBatch = 0;
async function commitIfFull() {
  if (opsInBatch >= 400) {
    await batch.commit();
    batch = db.batch();
    opsInBatch = 0;
  }
}

for (const u of usersToWrite) {
  batch.set(u.ref, { petCount: u.petCount, petLimit: u.petLimit, reminderLimitPerPet: u.reminderLimitPerPet }, { merge: true });
  opsInBatch++;
  await commitIfFull();
}
for (const p of petsToWrite) {
  batch.set(p.ref, { reminderCount: p.reminderCount }, { merge: true });
  opsInBatch++;
  await commitIfFull();
}
if (opsInBatch > 0) await batch.commit();

console.log(`\nMigrated ${usersToWrite.length} users and ${petsToWrite.length} pets.`);
process.exit(0);
