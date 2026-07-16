/**
 * PERF-008 — resize + encode images as WebP in the browser before upload.
 * Max edge 1600px keeps property/profile photos sharp on retina without multi‑MB PNG/JPEG.
 */

const MAX_EDGE_PX = 1600;
const WEBP_QUALITY = 0.82;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('WebP encode failed.'));
      },
      'image/webp',
      WEBP_QUALITY,
    );
  });
}

/** Returns a smaller WebP File when possible; otherwise the original file. */
export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToWebpBlob(canvas);
    // Keep original if WebP somehow got larger (rare tiny icons).
    if (blob.size >= file.size && file.type === 'image/webp' && scale === 1) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
}
