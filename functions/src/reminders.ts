import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

const TYPE_LABELS: Record<string, string> = {
  vaccine: 'Vacina',
  appointment: 'Consulta',
  medication: 'Medicação',
  grooming: 'Banho/Tosa',
  other: 'Lembrete',
};

const DEFAULT_PREFERRED_HOUR = 8;
const TIMEZONE = 'America/Fortaleza';
const SITE_URL = 'https://petvida.net.br';

function fortalezaParts(date: Date): { hour: number; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  const weekday = parts.find((p) => p.type === 'weekday')!.value; // 'Sun', 'Mon', ...
  return { hour, weekday };
}

function dateStringOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

interface ReminderInfo {
  id: string;
  title: string;
  type: string;
  time: string;
  kind: 'today' | 'vaccineTomorrow' | 'overdue';
}

async function sendToUser(
  db: FirebaseFirestore.Firestore,
  messaging: Messaging,
  userId: string,
  title: string,
  body: string,
  link: string
) {
  const tokensSnap = await db.collection('users').doc(userId).collection('fcmTokens').get();
  const tokens = tokensSnap.docs.map((d) => d.id);
  if (tokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: { fcmOptions: { link } },
  });

  const invalidTokens = response.responses
    .map((r, i) => (r.success ? null : tokens[i]))
    .filter((t): t is string => t !== null);
  await Promise.all(
    invalidTokens.map((token) => db.collection('users').doc(userId).collection('fcmTokens').doc(token).delete())
  );
}

// Runs hourly so each user can receive their daily reminder digest at their
// own preferred hour (see /settings/notifications). Also covers: vaccine
// advance notice (1 day before), overdue reminders (1 day after, unresolved),
// and a fixed weekly summary every Sunday 18h — per the v2 roadmap's F2.1.
export const sendReminderNotifications = onSchedule(
  { schedule: '0 * * * *', timeZone: TIMEZONE },
  async () => {
    const db = getFirestore();
    const messaging = getMessaging();
    const { hour, weekday } = fortalezaParts(new Date());

    const today = dateStringOffset(0);
    const tomorrow = dateStringOffset(1);
    const yesterday = dateStringOffset(-1);

    const [todaySnap, tomorrowVaccineSnap, yesterdaySnap] = await Promise.all([
      db.collection('reminders').where('date', '==', today).where('completed', '==', false).get(),
      db.collection('reminders').where('date', '==', tomorrow).where('type', '==', 'vaccine').where('completed', '==', false).get(),
      db.collection('reminders').where('date', '==', yesterday).where('completed', '==', false).get(),
    ]);

    const isWeeklySummarySlot = weekday === 'Sun' && hour === 18;

    const byUser = new Map<string, ReminderInfo[]>();
    const collect = (snap: FirebaseFirestore.QuerySnapshot, kind: ReminderInfo['kind']) => {
      for (const doc of snap.docs) {
        const data = doc.data();
        const list = byUser.get(data.userId) ?? [];
        list.push({ id: doc.id, title: data.title, type: data.type, time: data.time, kind });
        byUser.set(data.userId, list);
      }
    };
    collect(todaySnap, 'today');
    collect(tomorrowVaccineSnap, 'vaccineTomorrow');
    collect(yesterdaySnap, 'overdue');

    for (const [userId, items] of byUser) {
      const userSnap = await db.doc(`users/${userId}`).get();
      const settings = userSnap.data()?.notificationSettings ?? {};
      const remindersEnabled = settings.remindersEnabled ?? true;
      const urgentEnabled = settings.urgentEnabled ?? true;
      const preferredHour = settings.preferredHour ?? DEFAULT_PREFERRED_HOUR;
      if (!remindersEnabled || hour !== preferredHour) continue;

      const relevant = items.filter((i) => i.kind !== 'vaccineTomorrow' || urgentEnabled);
      if (relevant.length === 0) continue;

      if (relevant.length === 1) {
        const r = relevant[0];
        const label = r.kind === 'vaccineTomorrow' ? 'amanhã' : r.kind === 'overdue' ? 'atrasado' : 'hoje';
        await sendToUser(
          db, messaging, userId,
          `🐾 ${TYPE_LABELS[r.type] ?? 'Lembrete'} ${label}`,
          `${r.title}${r.time ? ` às ${r.time}` : ''}`,
          `${SITE_URL}/reminders?highlight=${r.id}`
        );
      } else {
        const overdueCount = relevant.filter((i) => i.kind === 'overdue').length;
        const body = overdueCount > 0
          ? `${relevant.length} no total, ${overdueCount} atrasado${overdueCount > 1 ? 's' : ''}`
          : relevant.map((r) => r.title).join(' · ');
        await sendToUser(db, messaging, userId, `🐾 Você tem ${relevant.length} lembretes`, body, `${SITE_URL}/reminders`);
      }
    }

    if (!isWeeklySummarySlot) return;

    const pendingSnap = await db.collection('reminders').where('completed', '==', false).get();
    const upcomingByUser = new Map<string, number>();
    const overdueByUser = new Map<string, number>();
    for (const doc of pendingSnap.docs) {
      const data = doc.data();
      const diffDays = Math.floor(
        (new Date(data.date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays <= 7) upcomingByUser.set(data.userId, (upcomingByUser.get(data.userId) ?? 0) + 1);
      else if (diffDays < 0) overdueByUser.set(data.userId, (overdueByUser.get(data.userId) ?? 0) + 1);
    }

    const summaryUserIds = new Set([...upcomingByUser.keys(), ...overdueByUser.keys()]);
    for (const userId of summaryUserIds) {
      const userSnap = await db.doc(`users/${userId}`).get();
      if (userSnap.data()?.notificationSettings?.weeklySummaryEnabled === false) continue;

      const upcoming = upcomingByUser.get(userId) ?? 0;
      const overdue = overdueByUser.get(userId) ?? 0;
      const body = overdue > 0
        ? `${upcoming} lembrete${upcoming !== 1 ? 's' : ''} nos próximos 7 dias · ${overdue} atrasado${overdue > 1 ? 's' : ''}`
        : `${upcoming} lembrete${upcoming !== 1 ? 's' : ''} nos próximos 7 dias`;
      await sendToUser(db, messaging, userId, '🐾 Resumo da semana', body, `${SITE_URL}/reminders`);
    }
  }
);
