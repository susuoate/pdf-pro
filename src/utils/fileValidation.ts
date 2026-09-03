export type DetectedFileType = 'pdf' | 'png' | 'jpeg' | 'webp' | 'unknown';

export interface FileValidationResult {
  isValid: boolean;
  detectedType: DetectedFileType;
  error?: string;
}

/**
 * Inspects initial byte signatures (magic bytes) to verify actual file format,
 * preventing spoofed extension vulnerabilities.
 */
export async function detectFileTypeFromBytes(
  data: ArrayBuffer | Uint8Array | Blob
): Promise<DetectedFileType> {
  let header: Uint8Array;

  if (data instanceof Blob) {
    const slice = data.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    header = new Uint8Array(buffer);
  } else if (data instanceof ArrayBuffer) {
    header = new Uint8Array(data.slice(0, 16));
  } else {
    header = data.subarray(0, 16);
  }

  if (header.length < 4) return 'unknown';

  // PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
    return 'pdf';
  }

  // PNG Magic Bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4E &&
    header[3] === 0x47 &&
    header[4] === 0x0D &&
    header[5] === 0x0A &&
    header[6] === 0x1A &&
    header[7] === 0x0A
  ) {
    return 'png';
  }

  // JPEG Magic Bytes: 0xFF, 0xD8, 0xFF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'jpeg';
  }

  // WebP Magic Bytes: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'webp';
  }

  return 'unknown';
}

/**
 * Validates whether a file is a valid PDF.
 */
export async function validatePdfFile(file: File | ArrayBuffer | Blob): Promise<FileValidationResult> {
  const detectedType = await detectFileTypeFromBytes(file);
  if (detectedType === 'pdf') {
    return { isValid: true, detectedType: 'pdf' };
  }
  return {
    isValid: false,
    detectedType,
    error: 'The uploaded file is not a valid PDF document.',
  };
}

/**
 * Validates whether a file is a valid image (PNG, JPEG, WebP).
 */
export async function validateImageFile(file: File | ArrayBuffer | Blob): Promise<FileValidationResult> {
  const detectedType = await detectFileTypeFromBytes(file);
  if (detectedType === 'png' || detectedType === 'jpeg' || detectedType === 'webp') {
    return { isValid: true, detectedType };
  }
  return {
    isValid: false,
    detectedType,
    error: 'The uploaded file is not a supported image format (JPEG, PNG, WebP).',
  };
}
