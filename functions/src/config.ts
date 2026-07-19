import { defineSecret, defineString } from 'firebase-functions/params';

// Secrets — actual values are set via `firebase functions:secrets:set NAME`,
// never committed to the repo.
export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// Price IDs are not secret, but they're still environment-specific config —
// they live in functions/.env.<project-id> (gitignored) or are set via
// `firebase functions:config` / the Functions console, never hardcoded here.
// See functions/.env.example for the variable names.
export const stripeProPriceId = defineString('STRIPE_PRO_PRICE_ID');
export const stripePremiumPriceId = defineString('STRIPE_PREMIUM_PRICE_ID');

export type PayingPlan = 'pro' | 'premium';

export class MissingStripeConfigError extends Error {
  constructor(missing: string[]) {
    super(`Missing required Stripe configuration: ${missing.join(', ')}`);
    this.name = 'MissingStripeConfigError';
  }
}

/**
 * Reads and validates the plan -> Price ID mapping at call time (never at
 * module load, since params are only resolved inside a running function).
 * Throws instead of silently falling back so a misconfigured deploy fails
 * loudly rather than granting/denying plans based on empty strings.
 */
export function getPlanPriceIds(): Record<PayingPlan, string> {
  const pro = stripeProPriceId.value();
  const premium = stripePremiumPriceId.value();
  const missing: string[] = [];
  if (!pro) missing.push('STRIPE_PRO_PRICE_ID');
  if (!premium) missing.push('STRIPE_PREMIUM_PRICE_ID');
  if (missing.length > 0) throw new MissingStripeConfigError(missing);
  return { pro, premium };
}

export function getPriceIdToPlan(): Record<string, PayingPlan> {
  const { pro, premium } = getPlanPriceIds();
  return { [pro]: 'pro', [premium]: 'premium' };
}
