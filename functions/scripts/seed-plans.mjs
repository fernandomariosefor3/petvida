// One-time script to populate the `plans` Firestore collection.
// Run from inside functions/ after `npm install`:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json node scripts/seed-plans.mjs
// (Download a service account key from Firebase Console -> Project settings -> Service accounts.)
//
// Adjust price/limits below before running against production if the
// placeholder numbers don't match what you actually want to charge.

import admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const plans = {
  free: {
    name: 'Grátis',
    maxPets: 3,
    maxRemindersPerPet: 5,
    features: ['healthRecords'],
    price: 0,
    active: true,
  },
  pro: {
    name: 'Pro',
    maxPets: 10,
    maxRemindersPerPet: 15,
    features: ['healthRecords', 'photoUpload'],
    price: 1490,
    active: true,
  },
  premium: {
    name: 'Premium',
    maxPets: -1,
    maxRemindersPerPet: -1,
    features: ['healthRecords', 'photoUpload', 'exportData'],
    price: 2999,
    active: true,
  },
};

for (const [id, data] of Object.entries(plans)) {
  await db.doc(`plans/${id}`).set(data, { merge: true });
  console.log(`✓ plans/${id} written`);
}

console.log('Done.');
process.exit(0);
