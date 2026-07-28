import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import app, { db } from './firebase';
import { trackEvent } from './analytics';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export type NotificationPermissionResult = 'granted' | 'denied' | 'unsupported' | 'error';

/**
 * Reported so the funnel `prompted -> granted -> received -> opened` is
 * measurable. `unsupported` is broken out on purpose: on iOS it means the user
 * is browsing without having installed the PWA to the home screen, which is the
 * single most likely reason a reminder never arrives.
 */
function reportPermission(result: NotificationPermissionResult, stage: string): NotificationPermissionResult {
  void trackEvent('push_permission_result', {
    result,
    stage,
    standalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
  });
  return result;
}

export async function enableReminderNotifications(userId: string): Promise<NotificationPermissionResult> {
  void trackEvent('push_permission_prompted');

  if (!(await isSupported())) return reportPermission('unsupported', 'isSupported');
  if (!VAPID_KEY) return reportPermission('error', 'missing_vapid_key');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return reportPermission('denied', 'user_denied');

  try {
    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return reportPermission('error', 'no_token');

    await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });

    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      void trackEvent('push_received_foreground', {
        reminder_type: payload.data?.reminderType ?? 'unknown',
      });
      if (title) new Notification(title, { body, icon: '/logo.png' });
    });

    return reportPermission('granted', 'token_stored');
  } catch {
    return reportPermission('error', 'exception');
  }
}

export async function disableReminderNotifications(userId: string): Promise<void> {
  if (!(await isSupported()) || !VAPID_KEY) return;
  try {
    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    const token = registration ? await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration }) : null;
    if (token) await deleteDoc(doc(db, 'users', userId, 'fcmTokens', token));
  } catch {
    /* best-effort cleanup */
  }
}
