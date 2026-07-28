import { trackEvent } from '@/lib/analytics';

/**
 * Push open attribution.
 *
 * The service worker cannot reach the app's analytics module, so it tags the
 * URL it opens on notification click (see public/firebase-messaging-sw.js).
 * On boot the app reads that tag, reports the open, then strips the params so
 * a refresh or a shared link never double-counts.
 *
 * What this measures: permission outcome, foreground receipt, and opens.
 * What it does NOT measure: actual delivery. FCM only reports delivery on its
 * own side — reading it requires the BigQuery export in the Firebase console.
 */
export function reportPushOpenFromUrl(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (url.searchParams.get('src') !== 'push') return;

  void trackEvent('push_opened', {
    reminder_type: url.searchParams.get('rtype') ?? 'unknown',
  });

  url.searchParams.delete('src');
  url.searchParams.delete('rtype');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
