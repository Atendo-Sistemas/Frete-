import jsQR from 'jsqr';

export interface ScanResult {
  type: 'QR_CODE' | 'BARCODE_NFE' | 'PLATE_MERCOSUL' | 'DOCUMENT';
  text: string;
  confidence?: number;
}

/**
 * Recognizes QR Code and Barcodes from a Canvas or Video frame using jsQR and Canvas analysis
 */
export const scanQrAndBarcodeFromCanvas = (
  canvas: HTMLCanvasElement
): ScanResult | null => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 1. Check for standard QR code using jsQR
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (qrCode && qrCode.data) {
      const cleanData = qrCode.data.trim();
      // Check if it's Danfe / NFe / CTe QR code or standard doc
      if (cleanData.includes('nfe') || cleanData.includes('cte') || cleanData.length >= 44) {
        return {
          type: 'BARCODE_NFE',
          text: cleanData,
          confidence: 0.98
        };
      }
      return {
        type: 'QR_CODE',
        text: cleanData,
        confidence: 0.95
      };
    }
  } catch (err) {
    console.warn('Scan frame error:', err);
  }

  return null;
};

/**
 * Plate Mercosul & Classic License Plate OCR Pattern Detector
 * Brasil Mercosul: ABC1D23 or Classic: ABC-1234
 */
export const parseBrazilianPlateFromText = (rawText: string): string | null => {
  if (!rawText) return null;
  const upper = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Mercosul format: 3 letters + 1 number + 1 letter + 2 numbers (e.g. BRA2E19)
  const mercosulMatch = upper.match(/([A-Z]{3}[0-9][A-Z][0-9]{2})/);
  if (mercosulMatch) {
    return mercosulMatch[1];
  }

  // Classic format: 3 letters + 4 numbers (e.g. ABC1234)
  const classicMatch = upper.match(/([A-Z]{3}[0-9]{4})/);
  if (classicMatch) {
    const m = classicMatch[1];
    return `${m.slice(0, 3)}-${m.slice(3)}`;
  }

  return null;
};
