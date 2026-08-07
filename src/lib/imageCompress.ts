/**
 * Resizes and compresses an image file into a small JPEG data URL, suitable
 * for localStorage (which has a hard size limit and no room for raw phone
 * photos of several MB).
 */
export function compressImageToDataUrl(file: File, maxDim = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);
      if (!ctx) { reject(new Error('Canvas 2D context indisponível.')); return; }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Não foi possível carregar a imagem.')); };
    img.src = objectUrl;
  });
}

/** Reverses compressImageToDataUrl's output back into a File, for upload. */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
