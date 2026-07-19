import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const TEST_PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-petvida-test';
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';

process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;

// Initialized as the DEFAULT app (no name) so that production code calling
// the bare getFirestore()/getAuth() (event-ledger.ts, subscription-sync.ts,
// counters.ts) resolves the same instance as code that takes `db` as an
// explicit parameter (pets.ts, reminders-crud.ts).
if (getApps().length === 0) {
  initializeApp({ projectId: TEST_PROJECT_ID });
}

/** Admin SDK connected to the local Firestore emulator — bypasses security rules, same as the real Callable Functions. */
export function getTestDb(): Firestore {
  return getFirestore();
}

/** Wipes all documents in the emulator between tests so cases don't leak state into each other. */
export async function clearFirestore(): Promise<void> {
  const res = await fetch(
    `http://${EMULATOR_HOST}/emulator/v1/projects/${TEST_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    throw new Error(`Failed to clear Firestore emulator (${res.status}) — is it running? See functions/package.json "test" script.`);
  }
}
