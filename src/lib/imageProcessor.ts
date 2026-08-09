// processPetImage: resize + compress images in the browser so uploads to Firebase remain below 5 MB
// - Accepts originals up to 25 MB
// - Produces images ideally < 4.5 MB
// - Preserves aspect ratio, avoids upscaling
// - Attempts WebP when useful, falls back to JPEG

import { detectImageMime } from './imageMime';

export interface ProcessedImage {
  file: File;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
  mimeType: string;
}

export function computeTargetDimensions(origW: number, origH: number, maxDim = 1600): { width: number; height: number } {
  const maxOriginal = Math.max(origW, origH);
  if (maxOriginal <= maxDim) return { width: origW, height: origH };
  const scale = maxDim / maxOriginal;
  return { width: Math.round(origW * scale), height: Math.round(origH * scale) };
}

async function canEncodeWebP(): Promise<boolean> {
  // Feature-detect via canvas
  try {
    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(2, 2) as any : document.createElement('canvas');
    if (!canvas.getContext) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    // toDataURL might throw for unsupported types
    const data = (canvas as HTMLCanvasElement).toDataURL('image/webp');
    return data.indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
}

function blobToFile(blob: Blob, name: string): File {
  try {
    return new File([blob], name, { type: blob.type });
  } catch (e) {
    // Older browsers may not support File constructor
    const f: any = blob;
    f.name = name;
    return f as File;
  }
}

export async function processPetImage(origFile: File): Promise<ProcessedImage> {
  const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25 MB
  const TARGET_SAFE_BYTES = 4.5 * 1024 * 1024; // target under 4.5MB
  const ABS_MAX_BYTES = 5 * 1024 * 1024; // Firebase limit

  if (origFile.size > MAX_INPUT_BYTES) {
    throw new Error('Arquivo original muito grande. Reduza a resolução ou escolha outra foto.');
  }

  const detected = await detectImageMime(origFile);
  if (!detected) throw new Error('Este arquivo não está em um formato de imagem compatível. Use JPG, PNG ou WEBP.');

  const preferWebP = await canEncodeWebP();

  // Decide output mime: prefer webp for PNG (to preserve alpha) or to get better compression
  let outMime = 'image/jpeg';
  if (detected === 'image/webp') outMime = 'image/webp';
  else if (detected === 'image/png') outMime = preferWebP ? 'image/webp' : 'image/png';
  else outMime = preferWebP ? 'image/webp' : 'image/jpeg';

  // Decode image to bitmap. Prefer createImageBitmap with orientation handling if available.
  let bitmap: ImageBitmap;
  try {
    // some browsers support imageOrientation option
    bitmap = await (createImageBitmap as any)(origFile, { imageOrientation: 'from-image' });
  } catch (e) {
    // fallback: try without options
    bitmap = await (createImageBitmap as any)(origFile);
  }

  const origW = bitmap.width;
  const origH = bitmap.height;

  let { width, height } = computeTargetDimensions(origW, origH, 1600);

  // OffscreenCanvas if available
  const makeCanvas = (w: number, h: number) => {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h) as any as HTMLCanvasElement;
    const c = document.createElement('canvas');
    c.width = w; c.height = h; return c;
  };

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Navegador não suporta processamento de imagens.');

  // If we may output jpeg and original is PNG with transparency, fill white background to avoid black background
  const shouldUseWhiteBG = outMime === 'image/jpeg' && detected === 'image/png';

  if (shouldUseWhiteBG) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw the bitmap scaled
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, origW, origH, 0, 0, width, height);

  // Compression & adaptive loop
  const qualities = [0.85, 0.78, 0.7, 0.62];
  const dimensionSteps = [1600, 1400, 1200, 1000];
  let finalBlob: Blob | null = null;
  let finalMime = outMime;
  let finalWidth = width;
  let finalHeight = height;

  async function toBlobPromise(mime: string, quality?: number): Promise<Blob | null> {
    return await new Promise(resolve => {
      // canvas might be OffscreenCanvas
      if ((canvas as any).convertToBlob) {
        // OffscreenCanvas API
        (canvas as any).convertToBlob({ type: mime, quality }).then((b: Blob) => resolve(b)).catch(() => resolve(null));
      } else {
        (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), mime, quality);
      }
    });
  }

  let produced = false;
  for (const dim of dimensionSteps) {
    // compute dims for this step
    const dims = computeTargetDimensions(origW, origH, dim);
    // avoid upscaling
    const targetW = dims.width;
    const targetH = dims.height;
    // redraw only if dims changed from current canvas
    if (targetW !== finalWidth || targetH !== finalHeight) {
      // resize canvas
      const c2 = makeCanvas(targetW, targetH);
      const ctx2 = c2.getContext('2d');
      if (!ctx2) throw new Error('Navegador não suporta processamento de imagens.');
      if (shouldUseWhiteBG) {
        ctx2.fillStyle = '#ffffff'; ctx2.fillRect(0, 0, targetW, targetH);
      }
      ctx2.imageSmoothingEnabled = true; ctx2.imageSmoothingQuality = 'high';
      ctx2.drawImage(bitmap, 0, 0, origW, origH, 0, 0, targetW, targetH);
      // replace canvas and ctx
      canvas.width = c2.width; canvas.height = c2.height; // for HTMLCanvas, set dims
      // copy pixels
      const ctxCopy = canvas.getContext('2d');
      if (!ctxCopy) throw new Error('Navegador não suporta processamento de imagens.');
      ctxCopy.clearRect(0, 0, canvas.width, canvas.height);
      ctxCopy.drawImage(c2 as any, 0, 0);
      finalWidth = targetW; finalHeight = targetH;
    }

    for (const q of qualities) {
      // try desired mime first; if webp unsupported, toBlob will likely return null
      let blob = await toBlobPromise(finalMime, q);
      if (!blob && finalMime === 'image/webp') {
        // fallback to jpeg
        blob = await toBlobPromise('image/jpeg', q);
        if (blob) finalMime = 'image/jpeg';
      }
      if (!blob) continue;
      if (blob.size <= TARGET_SAFE_BYTES) {
        finalBlob = blob; produced = true; break;
      }
    }
    if (produced) break;
  }

  // If still not produced, try full-quality last resort and then check; then progressively reduce quality without further resizing
  if (!finalBlob) {
    for (const q of qualities) {
      const blob = await toBlobPromise(finalMime, q);
      if (!blob) continue;
      if (blob.size <= ABS_MAX_BYTES) { finalBlob = blob; break; }
    }
  }

  if (!finalBlob) {
    // As a last resort, attempt JPEG at low quality
    const fallback = await toBlobPromise('image/jpeg', 0.5);
    if (fallback && fallback.size <= ABS_MAX_BYTES) finalBlob = fallback;
  }

  if (!finalBlob) throw new Error('Não foi possível reduzir a imagem abaixo do limite de upload. Escolha outra foto.');

  const ext = finalMime === 'image/png' ? 'png' : finalMime === 'image/webp' ? 'webp' : 'jpg';
  const name = `pet_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
  const outFile = blobToFile(finalBlob, name);

  // ensure processed size <= ABS_MAX_BYTES
  if (outFile.size > ABS_MAX_BYTES) throw new Error('Procesamento não conseguiu gerar arquivo menor que 5 MB.');

  return {
    file: outFile,
    originalSize: origFile.size,
    processedSize: outFile.size,
    width: finalWidth,
    height: finalHeight,
    mimeType: finalMime,
  };
}
