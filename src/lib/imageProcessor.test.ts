import { computeTargetDimensions } from './imageProcessor';
import assert from 'assert';

// Pure unit tests for computeTargetDimensions (run manually in a browser-aware test runner if desired)
(function run() {
  // no upscale
  assert.deepStrictEqual(computeTargetDimensions(1200, 900, 1600), { width: 1200, height: 900 });
  // downscale landscape
  const d1 = computeTargetDimensions(4000, 3000, 1600);
  assert.strictEqual(Math.max(d1.width, d1.height), 1600);
  assert.strictEqual(Math.round(d1.width / d1.height), Math.round(4000 / 3000));
  // downscale portrait
  const d2 = computeTargetDimensions(3000, 4000, 1600);
  assert.strictEqual(Math.max(d2.width, d2.height), 1600);
  // square
  const d3 = computeTargetDimensions(2000, 2000, 1600);
  assert.strictEqual(d3.width, 1600);
  assert.strictEqual(d3.height, 1600);
  console.log('imageProcessor.computeTargetDimensions: basic tests passed');
})();
