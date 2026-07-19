import type { PayingPlan } from './config.js';

export class UnknownPriceIdError extends Error {
  constructor(public readonly priceId: string) {
    super(`Unrecognized Stripe price ID: ${priceId}`);
    this.name = 'UnknownPriceIdError';
  }
}

/**
 * Resolves a Stripe Price ID to a plan. Never falls back to a default plan —
 * an unrecognized price ID must never silently grant Free, Pro, or Premium.
 * Callers are expected to catch UnknownPriceIdError, log it, leave the
 * user's plan untouched, and rethrow so the Stripe webhook retries.
 */
export function resolvePlanFromPriceId(
  priceId: string | undefined | null,
  priceIdToPlan: Record<string, PayingPlan>
): PayingPlan {
  if (!priceId) throw new UnknownPriceIdError(String(priceId));
  const plan = priceIdToPlan[priceId];
  if (!plan) throw new UnknownPriceIdError(priceId);
  return plan;
}
