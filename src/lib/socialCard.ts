async function inlineImages(node: HTMLElement): Promise<() => void> {
  const imgs = Array.from(node.querySelectorAll('img'));
  const restoreFns: (() => void)[] = [];

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;

      try {
        const res = await fetch(src);
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            img.setAttribute('src', dataUrl);
            restoreFns.push(() => {
              img.setAttribute('src', src);
            });
          }
        }
      } catch {
        // Ignore fetch errors, html-to-image default behavior will apply
      }
    })
  );

  return () => {
    restoreFns.forEach((restore) => restore());
  };
}

/** Dynamically imported so html-to-image never lands in the main bundle — only pulled in when the share modal opens. */
export async function renderCardToPng(node: HTMLElement): Promise<string> {
  const restore = await inlineImages(node);
  try {
    const { toPng } = await import('html-to-image');
    return await toPng(node, { pixelRatio: 4, cacheBust: false });
  } finally {
    restore();
  }
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
