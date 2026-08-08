/* global process */
import { strict as assert } from 'assert';
import { detectImageMime } from './imageMime';

// Helper to build a File-like object with slice() implemented via Blob
function makeFileFromBytes(bytes: number[], name = 'file'): File {
  const blob = new Uint8Array(bytes).buffer;
  const file = new File([blob], name);
  return file;
}

async function runTests() {
  // JPEG header
  const jpeg = makeFileFromBytes([0xFF, 0xD8, 0xFF, 0xE0]);
  assert.equal(await detectImageMime(jpeg), 'image/jpeg');

  // JFIF (also JPEG)
  const jfif = makeFileFromBytes([0xFF, 0xD8, 0xFF, 0xE1], 'photo.jfif');
  assert.equal(await detectImageMime(jfif), 'image/jpeg');

  // JPEG no extension
  const jpegNoExt = makeFileFromBytes([0xFF, 0xD8, 0xFF]);
  assert.equal(await detectImageMime(jpegNoExt), 'image/jpeg');

  // PNG
  const png = makeFileFromBytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  assert.equal(await detectImageMime(png), 'image/png');

  // WEBP: 'RIFF'....'WEBP'
  const webp = makeFileFromBytes([
    0x52,0x49,0x46,0x46, 0x00,0x00,0x00,0x00, 0x57,0x45,0x42,0x50
  ]);
  assert.equal(await detectImageMime(webp), 'image/webp');

  // PDF renamed to jpg: PDF header: %PDF-
  const pdf = makeFileFromBytes([0x25,0x50,0x44,0x46,0x2D], 'malicious.jpg');
  assert.equal(await detectImageMime(pdf), null);

  // Random bytes but declared image/jpeg (detector must reject)
  const random = makeFileFromBytes([0x00,0x11,0x22,0x33], 'random.jpg');
  assert.equal(await detectImageMime(random), null);

  console.log('imageMime tests passed');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
