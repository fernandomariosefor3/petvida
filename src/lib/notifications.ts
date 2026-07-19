import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import app, { db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export type NotificationPermissionResult = 'granted' | 'denied' | 'unsupported' | 'error';

export async function enableReminderNotifications(userId: string): Promise<NotificationPermissionResult> {
  if (!(await isSupported())) return 'unsupported';
  if (!VAPID_KEY) return 'error';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  try {
    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return 'error';

    await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    });

    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      if (title) new Notification(title, { body, icon: '/logo.png' });
    });

    return 'granted';
  } catch {
    return 'error';
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
