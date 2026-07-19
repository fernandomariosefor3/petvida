import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const FREE_PLAN_DEFAULTS = { maxPets: 3, maxRemindersPerPet: 5 };

// Keeps users/{userId}.petCount in sync with the actual number of pet docs,
// since Firestore security rules cannot count a collection directly.
export const onPetCreatedIncrementCount = onDocumentCreated('pets/{petId}', async (event) => {
  const userId = event.data?.data().userId;
  if (!userId) return;
  await getFirestore().doc(`users/${userId}`).set({ petCount: FieldValue.increment(1) }, { merge: true });
});

export const onPetDeletedDecrementCount = onDocumentDeleted('pets/{petId}', async (event) => {
  const userId = event.data?.data().userId;
  if (!userId) return;
  await getFirestore().doc(`users/${userId}`).set({ petCount: FieldValue.increment(-1) }, { merge: true });
});

// Keeps pets/{petId}.reminderCount in sync so security rules can enforce
// maxRemindersPerPet without running a query inside the rule.
export const onReminderCreatedIncrementCount = onDocumentCreated('reminders/{reminderId}', async (event) => {
  const petId = event.data?.data().petId;
  if (!petId) return;
  await getFirestore().doc(`pets/${petId}`).set({ reminderCount: FieldValue.increment(1) }, { merge: true });
});

export const onReminderDeletedDecrementCount = onDocumentDeleted('reminders/{reminderId}', async (event) => {
  const petId = event.data?.data().petId;
  if (!petId) return;
  await getFirestore().doc(`pets/${petId}`).set({ reminderCount: FieldValue.increment(-1) }, { merge: true });
});

// Whenever a user's plan changes (registration, Stripe webhook, admin panel),
// resolve the plan's limits from the `plans` collection and denormalize them
// onto the user doc as petLimit/reminderLimitPerPet, so Firestore rules can
// enforce quotas with a single get() instead of a nested lookup.
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
