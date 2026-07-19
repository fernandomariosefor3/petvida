// Idempotent script to populate the `plans` Firestore collection. Safe to
// run more than once — writes are keyed by plan id and merged, never
// duplicated.
//
// Run from inside functions/ after `npm install`:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json \
//     node scripts/seed-plans.mjs --project petvid-82a98 [--dry-run] [--yes]
//
// Prices below are placeholders, NOT final commercial pricing — adjust them
// (or wire this script to read from a config file) before relying on them.

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

// Structure matches what the app and Cloud Functions expect: identifier
// (doc id), name, pet/reminder limits, features, active flag, display order.
// -1 means unlimited (Firestore has no Infinity).
const plans = {
  free: {
    name: 'Grátis',
    maxPets: 3,
    maxRemindersPerPet: 5,
    features: ['healthRecords'],
    price: 0,
    active: true,
    order: 0,
  },
  pro: {
    name: 'Pro',
    maxPets: 10,
    maxRemindersPerPet: 15,
    features: ['healthRecords', 'photoUpload'],
    price: 1490, // placeholder cents — NOT final pricing
    active: true,
    order: 1,
  },
  premium: {
    name: 'Premium',
    maxPets: -1,
    maxRemindersPerPet: -1,
    features: ['healthRecords', 'photoUpload', 'exportData'],
    price: 2999, // placeholder cents — NOT final pricing
    active: true,
    order: 2,
  },
};

console.log(`Project: ${actualProjectId}`);
console.log(`Mode:    ${dryRun ? 'DRY RUN — no writes will be made' : 'WRITE'}`);
console.log('Plans to write:');
for (const [id, data] of Object.entries(plans)) {
  console.log(`  - plans/${id}: ${JSON.stringify(data)}`);
}

if (!confirmed) {
  console.error('\nRefusing to write without --yes (or use --dry-run to preview only).');
  process.exit(1);
}

if (dryRun) {
  console.log('\nDry run complete — nothing was written.');
  process.exit(0);
}

for (const [id, data] of Object.entries(plans)) {
  await db.doc(`plans/${id}`).set(data, { merge: true });
  console.log(`✓ plans/${id} written`);
}

console.log('Done.');
process.exit(0);
