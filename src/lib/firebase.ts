import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export default app;

const COOKIE_CONSENT_KEY = 'petvida_cookie_consent';

function hasAnalyticsConsent(): boolean {
  const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return false;
  try {
    return JSON.parse(raw).analytics === true;
  } catch {
    return false;
  }
}

let analyticsInstance: Analytics | null = null;

// Only starts Analytics after LGPD cookie consent is recorded (set by the
// consent banner) — never initialize this unconditionally on app load.
export async function initAnalyticsIfConsented(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;
  if (!firebaseConfig.measurementId) return null;
  if (!hasAnalyticsConsent()) return null;
  if (!(await isSupported())) return null;

  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}
