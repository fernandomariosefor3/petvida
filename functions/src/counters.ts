import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';

const FREE_PLAN_DEFAULTS = { maxPets: 3, maxRemindersPerPet: 5 };

// Whenever a user's plan changes (registration, Stripe webhook, admin claim
// action), resolve the plan's limits from the `plans` collection and
// denormalize them onto the user doc as petLimit/reminderLimitPerPet, so the
// createPet/createReminder Callable Functions can read them with a single
// get() instead of a nested lookup. This never touches petCount incrementally
// (only initializes it once for brand-new users), so it cannot double-count
// alongside the transactional Callable Functions in pets.ts/reminders-crud.ts.
export const onUserPlanChangedSyncLimits = onDocumentWritten('users/{userId}', async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return;
  const data = after.data() ?? {};
  const planId = (data.plan as string) || 'free';

  const planSnap = await getFirestore().doc(`plans/${planId}`).get();
  const planData = planSnap.exists ? planSnap.data() : null;
  const maxPets = (planData?.maxPets as number) ?? (planId === 'free' ? FREE_PLAN_DEFAULTS.maxPets : -1);
  const maxRemindersPerPet = (planData?.maxRemindersPerPet as number) ?? (planId === 'free' ? FREE_PLAN_DEFAULTS.maxRemindersPerPet : -1);

  const needsSync = data.petLimit !== maxPets || data.reminderLimitPerPet !== maxRemindersPerPet || data.petCount === undefined;
  if (!needsSync) return;

  await after.ref.set(
    {
      petLimit: maxPets,
      reminderLimitPerPet: maxRemindersPerPet,
      petCount: data.petCount ?? 0,
    },
    { merge: true }
  );
});

// Reconciliation, not a counting mechanism: pet/reminder creation and
// deletion count atomically inside their own Firestore transactions (see
// createPetTransaction/deletePetTransaction/createReminderTransaction/
// deleteReminderTransaction). This job exists only as a safety net against
// drift (e.g. a doc deleted directly via the Admin SDK/console, bypassing
// the Callable Functions) — it recomputes true counts from the source
// collections and overwrites (not increments) any value that has drifted,
// so re-running it never double-counts.
export const reconcileCounters = onSchedule(
  { schedule: '0 4 * * *', timeZone: 'America/Fortaleza' },
  async () => {
    const db = getFirestore();

    const petsSnap = await db.collection('pets').get();
    const petCountByUser = new Map<string, number>();
    for (const doc of petsSnap.docs) {
      const userId = doc.data().userId as string | undefined;
      if (!userId) continue;
      petCountByUser.set(userId, (petCountByUser.get(userId) ?? 0) + 1);
    }

    const remindersSnap = await db.collection('reminders').get();
    const reminderCountByPet = new Map<string, number>();
    for (const doc of remindersSnap.docs) {
      const petId = doc.data().petId as string | undefined;
      if (!petId) continue;
      reminderCountByPet.set(petId, (reminderCountByPet.get(petId) ?? 0) + 1);
    }

    const usersSnap = await db.collection('users').get();
    let batch = db.batch();
    let opsInBatch = 0;
    const commitIfFull = async () => {
      if (opsInBatch >= 400) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    };

    for (const doc of usersSnap.docs) {
      const truth = petCountByUser.get(doc.id) ?? 0;
      if (doc.data().petCount !== truth) {
        batch.set(doc.ref, { petCount: truth }, { merge: true });
        opsInBatch++;
        await commitIfFull();
      }
    }
    for (const doc of petsSnap.docs) {
      const truth = reminderCountByPet.get(doc.id) ?? 0;
      if (doc.data().reminderCount !== truth) {
        batch.set(doc.ref, { reminderCount: truth }, { merge: true });
        opsInBatch++;
        await commitIfFull();
      }
    }

    if (opsInBatch > 0) await batch.commit();
  }
);
