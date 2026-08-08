/** Dynamically imported so html-to-image never lands in the main bundle — only pulled in when the share modal opens. */
export async function renderCardToPng(node: HTMLElement): Promise<string> {
  const { toPng } = await import('html-to-image');
  return toPng(node, { pixelRatio: 4, cacheBust: true });
}

export function downloadCardImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

/** Web Share API with file support — the only way to hand an image straight to WhatsApp without hosting it. Returns false when unsupported, so the caller can hide the button instead of showing one that silently fails. */
export async function shareCardImage(dataUrl: string, filename: string, text: string): Promise<boolean> {
  const file = await dataUrlToFile(dataUrl, filename);
  const canShareFiles = typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] });
  if (!canShareFiles) return false;

  await navigator.share({ files: [file], text });
  return true;
}

export function canShareFiles(): boolean {
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
}
