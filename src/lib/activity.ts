import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const THROTTLE_KEY = 'petvida_last_active_ping';
const THROTTLE_MS = 6 * 60 * 60 * 1000; // 6h

/**
 * Stamps users/{uid}.lastActiveAt so retention (D1/D7/D30) becomes computable.
 *
 * Throttled to once per 6h per browser: without it every page load would be a
 * Firestore write, which is both a cost and a pointless one — retention is
 * measured in days, not minutes.
 *
 * `lastActiveAt` is deliberately NOT one of the server-managed keys guarded in
 * firestore.rules, so a user writing their own timestamp is already allowed by
 * the existing `allow update` rule. No rules change is required.
 */
export async function pingUserActivity(userId: string): Promise<void> {
  try {
    const last = Number(localStorage.getItem(THROTTLE_KEY) ?? 0);
    if (Date.now() - last < THROTTLE_MS) return;

    await setDoc(doc(db, 'users', userId), { lastActiveAt: serverTimestamp() }, { merge: true });
    localStorage.setItem(THROTTLE_KEY, String(Date.now()));
  } catch {
    /* Telemetry must never block or break the app. */
  }
}
