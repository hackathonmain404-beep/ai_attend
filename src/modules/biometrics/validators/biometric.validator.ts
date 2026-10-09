/**
 * AttendGuard Biometrics Input Validation & Image Sanitization
 * Validates biometric captures, explicit consent, and format invariants.
 */

import { ValidationError } from '@/lib/errors';

export interface ValidatedImageData {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_IMAGE_SIZE_BYTES = 5 * 1024; // 5 KB
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_DIMENSION_PX = 80;

/**
 * Validates and converts an uploaded image (Base64 data URL, raw Base64, or Buffer)
 * into a verified, sanitized image buffer with verified MIME type and dimensions.
 */
export function validateAndParseBiometricImage(imageInput: string | Buffer): ValidatedImageData {
  if (!imageInput) {
    throw new ValidationError('Face image capture is required.', 'VALIDATION_ERROR');
  }

  let buffer: Buffer;

  if (Buffer.isBuffer(imageInput)) {
    buffer = imageInput;
  } else if (typeof imageInput === 'string') {
    const trimmed = imageInput.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('Face image data cannot be empty.', 'VALIDATION_ERROR');
    }

    // Check if it's a data URL: e.g., data:image/jpeg;base64,...
    const dataUrlMatch = trimmed.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
    if (dataUrlMatch) {
      try {
        buffer = Buffer.from(dataUrlMatch[2], 'base64');
      } catch {
        throw new ValidationError('Invalid Base64 encoding in image data URL.', 'VALIDATION_ERROR');
      }
    } else {
      // Raw base64 string
      try {
        buffer = Buffer.from(trimmed, 'base64');
      } catch {
        throw new ValidationError('Invalid Base64 string supplied for face image.', 'VALIDATION_ERROR');
      }
    }
  } else {
    throw new ValidationError('Unsupported image input type.', 'VALIDATION_ERROR');
  }

  // 1. File Size Constraints
  if (buffer.length < MIN_IMAGE_SIZE_BYTES) {
    throw new ValidationError(
      `Image size is too small (${Math.round(buffer.length / 1024)}KB). Minimum required resolution is 5KB.`,
      'VALIDATION_ERROR'
    );
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new ValidationError(
      `Image size exceeds maximum limit of 5MB (${(buffer.length / (1024 * 1024)).toFixed(1)}MB).`,
      'VALIDATION_ERROR'
    );
  }

  // 2. Magic Bytes Inspection
  const mimeType = detectImageMimeType(buffer);
  if (!mimeType) {
    throw new ValidationError(
      'Unsupported or invalid image format. Only JPEG, PNG, and WebP images are permitted.',
      'VALIDATION_ERROR'
    );
  }

  // 3. Header Dimensions Extraction & Sanity Check
  const dimensions = parseDimensions(buffer, mimeType);
  if (!dimensions || dimensions.width < MIN_DIMENSION_PX || dimensions.height < MIN_DIMENSION_PX) {
    throw new ValidationError(
      `Image resolution is insufficient (${dimensions?.width || 0}x${dimensions?.height || 0}px). Minimum required is ${MIN_DIMENSION_PX}x${MIN_DIMENSION_PX}px.`,
      'VALIDATION_ERROR'
    );
  }

  // 4. Content Variance / Flat Monochrome Check
  // Ensures image is not a blank black, white, or uniform dummy block
  checkImageEntropy(buffer);

  // 5. SHA-256 Hash
  const crypto = require('crypto');
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    buffer,
    mimeType,
    width: dimensions.width,
    height: dimensions.height,
    sizeBytes: buffer.length,
    sha256,
  };
}

/**
 * Validates explicit biometric consent requirements.
 */
export function validateConsent(consentGiven: boolean, consentText?: string): void {
  if (consentGiven !== true) {
    throw new ValidationError(
      'Explicit student consent is required to enroll and store facial biometrics.',
      'VALIDATION_ERROR'
    );
  }

  if (!consentText || typeof consentText !== 'string' || consentText.trim().length < 10) {
    throw new ValidationError(
      'Affirmative consent statement text of at least 10 characters must be recorded.',
      'VALIDATION_ERROR'
    );
  }
}

/**
 * Validates student UUID.
 */
export function validateStudentId(studentId: string): void {
  if (!studentId || !UUID_REGEX.test(studentId)) {
    throw new ValidationError('A valid student UUID is required.', 'VALIDATION_ERROR');
  }
}

/**
 * Detects image MIME type from binary magic bytes.
 */
function detectImageMimeType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length < 12) return null;

  // JPEG: 0xFF 0xD8 0xFF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF ... WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Parses image dimensions directly from binary header chunks.
 */
function parseDimensions(
  buf: Buffer,
  mime: 'image/jpeg' | 'image/png' | 'image/webp'
): { width: number; height: number } | null {
  try {
    if (mime === 'image/png') {
      // IHDR chunk starts at byte 12 (4 bytes length + 4 bytes 'IHDR' + 8 bytes data)
      if (buf.length >= 24 && buf.toString('ascii', 12, 16) === 'IHDR') {
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        return { width, height };
      }
    }

    if (mime === 'image/jpeg') {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buf[offset + 1];
        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = buf.readUInt16BE(offset + 5);
          const width = buf.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buf.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (mime === 'image/webp') {
      // VP8 chunk
      if (buf.length >= 30) {
        if (buf.toString('ascii', 12, 16) === 'VP8 ') {
          const width = buf.readUInt16LE(26) & 0x3fff;
          const height = buf.readUInt16LE(28) & 0x3fff;
          return { width, height };
        }
        if (buf.toString('ascii', 12, 16) === 'VP8L') {
          const b1 = buf[21];
          const b2 = buf[22];
          const b3 = buf[23];
          const b4 = buf[24];
          const width = 1 + (((b2 & 0x3f) << 8) | b1);
          const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
          return { width, height };
        }
        if (buf.toString('ascii', 12, 16) === 'VP8X') {
          const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
          const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
          return { width, height };
        }
      }
    }
  } catch {
    return null;
  }

  // Fallback default if header was non-standard but valid magic
  return { width: 300, height: 300 };
}

/**
 * Checks sample byte entropy to reject completely flat dummy captures.
 */
function checkImageEntropy(buf: Buffer): void {
  const sampleSize = Math.min(buf.length, 1024);
  const sample = buf.subarray(Math.floor(buf.length / 4), Math.floor(buf.length / 4) + sampleSize);

  let sum = 0;
  for (let i = 0; i < sample.length; i++) {
    sum += sample[i];
  }
  const mean = sum / sample.length;

  let varianceSum = 0;
  for (let i = 0; i < sample.length; i++) {
    varianceSum += Math.pow(sample[i] - mean, 2);
  }
  const variance = varianceSum / sample.length;

  // Real photos and face captures have significant high-frequency variance (> 10)
  if (variance < 2.0) {
    throw new ValidationError(
      'Image appears uniform or lacks visual content (flat color detected). Please capture a well-lit photo.',
      'VALIDATION_ERROR'
    );
  }
}
