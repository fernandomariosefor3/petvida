export function determineImageMime(file: File): string | null {
  const allowedExts: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
  };

  // Prefer the browser-provided MIME if it clearly indicates an image
  if (file.type && file.type.startsWith('image/')) return file.type;

  // Derive by extension when MIME is empty or not usable
  const name = (file.name || '').toLowerCase();
  const idx = name.lastIndexOf('.');
  if (idx === -1) return null;
  const ext = name.slice(idx + 1);
  const mapped = allowedExts[ext];
  if (mapped) return mapped;

  // If file.type exists but doesn't start with image/, reject to avoid accepting arbitrary types
  if (file.type) return null;

  // No type and no allowed extension
  return null;
}
