import { logEvent } from 'firebase/analytics';
import { initAnalyticsIfConsented } from '@/lib/firebase';

// No-ops silently when analytics isn't available (no cookie consent yet,
// browser unsupported, or measurementId not configured) — event tracking is
// a progressive enhancement, never a blocker for the underlying action.
export async function trackEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  const analytics = await initAnalyticsIfConsented();
  if (!analytics) return;
  logEvent(analytics, name, params);
}
