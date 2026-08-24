import { ImageCompressionConfig } from '../types';

export const DEFAULT_COMPRESSION_CONFIG: ImageCompressionConfig = {
  enabled: true,
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
  format: 'image/jpeg',
  autoCompressDocuments: true,
  maxFileSizeKB: 400
};

export interface CompressionResult {
  dataUrl: string;
  originalSize: number; // in bytes
  compressedSize: number; // in bytes
  reductionPercent: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Calculates byte size of a base64 Data URL
 */
export function getDataUrlByteSize(dataUrl: string): number {
  if (!dataUrl || !dataUrl.includes(',')) return 0;
  const base64 = dataUrl.split(',')[1] || '';
  const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/**
 * Formats bytes to human-readable string (e.g. 1.2 MB, 340 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Loads an Image element from a Data URL or Object URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Compresses an image (File, Blob, or base64 dataUrl)
 */
export async function compressImage(
  input: File | Blob | string,
  customOptions?: Partial<ImageCompressionConfig>
): Promise<CompressionResult> {
  const options: ImageCompressionConfig = {
    ...DEFAULT_COMPRESSION_CONFIG,
    ...customOptions
  };

  let originalDataUrl = '';
  let originalSize = 0;

  if (typeof input === 'string') {
    originalDataUrl = input;
    originalSize = getDataUrlByteSize(input);
  } else {
    originalSize = input.size;
    originalDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  }

  // If compression is disabled, return original dataUrl
  if (!options.enabled) {
    return {
      dataUrl: originalDataUrl,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      width: 0,
      height: 0,
      mimeType: originalDataUrl.split(';')[0]?.replace('data:', '') || 'image/jpeg'
    };
  }

  try {
    const img = await loadImage(originalDataUrl);
    let { width, height } = img;

    // Calculate new dimensions preserving aspect ratio
    const maxWidth = options.maxWidth || 1600;
    const maxHeight = options.maxHeight || 1600;

    if (width > maxWidth || height > maxHeight) {
      if (width / height > maxWidth / maxHeight) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    // Canvas drawing
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // High quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill white background in case of transparent PNG being converted to JPEG
    if (options.format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    const format = options.format || 'image/jpeg';
    const quality = Math.min(1.0, Math.max(0.1, options.quality || 0.8));

    let compressedDataUrl = canvas.toDataURL(format, quality);
    let compressedSize = getDataUrlByteSize(compressedDataUrl);

    // If compressed result is somehow larger than original (e.g. tiny 10kb icon), use original
    if (compressedSize > originalSize && originalDataUrl.startsWith('data:image/')) {
      compressedDataUrl = originalDataUrl;
      compressedSize = originalSize;
    }

    const reductionPercent = originalSize > 0 
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100)) 
      : 0;

    return {
      dataUrl: compressedDataUrl,
      originalSize,
      compressedSize,
      reductionPercent,
      width,
      height,
      mimeType: format
    };
  } catch (error) {
    console.warn('Image compression fallback to original:', error);
    return {
      dataUrl: originalDataUrl,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      width: 0,
      height: 0,
      mimeType: 'image/jpeg'
    };
  }
}

/**
 * Fast helper to compress a File directly to optimized dataUrl string
 */
export async function compressImageFile(
  file: File,
  customOptions?: Partial<ImageCompressionConfig>
): Promise<string> {
  const result = await compressImage(file, customOptions);
  return result.dataUrl;
}
