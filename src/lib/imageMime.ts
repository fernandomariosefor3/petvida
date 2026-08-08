// detectImageMime reads the file's starting bytes (magic numbers) to determine image type.
// Returns a MIME string ('image/jpeg' | 'image/png' | 'image/webp') or null when unknown.
export async function detectImageMime(file: File): Promise<string | null> {
  // Read the first 12 bytes which are enough for JPEG, PNG and WEBP detection.
  const header = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(header);

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
    bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A
  ) {
    return 'image/png';
  }

  // WEBP: "RIFF" at 0..3 and "WEBP" at 8..11
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // 'RIFF'
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // 'WEBP'
  ) {
    return 'image/webp';
  }

  // No known signature
  return null;
}
