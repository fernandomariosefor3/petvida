import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlanFromPriceId, UnknownPriceIdError } from '../src/plan-resolution.js';

const PRICE_MAP = { price_pro_123: 'pro', price_premium_456: 'premium' } as const;

test('resolves a known Pro price ID to the pro plan', () => {
  assert.equal(resolvePlanFromPriceId('price_pro_123', PRICE_MAP), 'pro');
});

test('resolves a known Premium price ID to the premium plan', () => {
  assert.equal(resolvePlanFromPriceId('price_premium_456', PRICE_MAP), 'premium');
});

test('throws UnknownPriceIdError for an unrecognized price ID — never falls back to a default plan', () => {
  assert.throws(() => resolvePlanFromPriceId('price_totally_unknown', PRICE_MAP), UnknownPriceIdError);
});

test('throws UnknownPriceIdError when the price ID is missing/undefined', () => {
  assert.throws(() => resolvePlanFromPriceId(undefined, PRICE_MAP), UnknownPriceIdError);
});

test('throws UnknownPriceIdError when the price ID is an empty string', () => {
  assert.throws(() => resolvePlanFromPriceId('', PRICE_MAP), UnknownPriceIdError);
});
