import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { createCheckoutSession, stripeWebhook } from './stripe.js';
export { createPortalSession, listInvoices, downgradeOverduePayments } from './billing.js';
export {
  onPetCreatedIncrementCount,
  onPetDeletedDecrementCount,
  onReminderCreatedIncrementCount,
  onReminderDeletedDecrementCount,
  onUserPlanChangedSyncLimits,
} from './counters.js';
export { sendReminderNotifications } from './reminders.js';
