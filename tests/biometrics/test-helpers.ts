/**
 * Test Helpers for AttendGuard Biometrics Test Suite
 * Generates synthetic, mathematically consistent image buffers without external assets.
 */

import crypto from 'crypto';

/**
 * Creates a valid synthetic PNG image buffer of specified dimensions and size,
 * with deterministic variance controlled by seed.
 */
export function createSyntheticFacePng(
  seed = 42,
  sizeBytes = 8192,
  width = 120,
  height = 120
): Buffer {
  const buf = Buffer.alloc(Math.max(sizeBytes, 5120));

  // 1. PNG Signature (8 bytes)
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) buf[i] = pngSig[i];

  // 2. IHDR Chunk: length (13), type ('IHDR'), width (4B), height (4B), bitDepth (1B), colorType (1B), ...
  buf.writeUInt32BE(13, 8); // length
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf[24] = 8; // 8-bit depth
  buf[25] = 2; // RGB
  buf[26] = 0; // compression
  buf[27] = 0; // filter
  buf[28] = 0; // interlace
  // CRC placeholder for IHDR
  buf.writeUInt32BE(0x57635243, 29);

  // 3. IDAT / Content payload with deterministic variance based on seed
  // Emulates realistic facial luminance distributions (mid-tones around 120-160 with edges)
  let current = (seed * 37) % 256;
  for (let i = 33; i < buf.length - 12; i++) {
    // Generate pseudo-random organic gradient
    current = (current * 73 + seed + (i % 31)) % 256;
    // Keep in comfortable luma range (40 - 200) with strong variance
    const val = 40 + (current % 160);
    buf[i] = val;
  }

  // 4. IEND Chunk (12 bytes at end)
  const endOffset = buf.length - 12;
  buf.writeUInt32BE(0, endOffset); // length 0
  buf.write('IEND', endOffset + 4, 'ascii');
  buf.writeUInt32BE(0xae426082, endOffset + 8); // IEND CRC

  return buf;
}

/**
 * Creates a synthetic image with slight noise / perturbation relative to base seed
 * to simulate slight pose/lighting re-capture of the SAME student.
 */
export function createPerturbedFacePng(baseSeed = 42, noiseLevel = 3): Buffer {
  const base = createSyntheticFacePng(baseSeed);
  const copy = Buffer.from(base);

  // Perturb 5% of pixels slightly
  for (let i = 33; i < copy.length - 12; i += 20) {
    const delta = ((i % noiseLevel) - Math.floor(noiseLevel / 2)) * 2;
    copy[i] = Math.max(40, Math.min(200, copy[i] + delta));
  }

  return copy;
}

/**
 * Creates an image that triggers inconclusive similarity against baseSeed
 * by blending 50% baseSeed and 50% alternate seed.
 */
export function createInconclusiveFacePng(seedA = 42, seedB = 999): Buffer {
  const bufA = createSyntheticFacePng(seedA);
  const bufB = createSyntheticFacePng(seedB);
  const blend = Buffer.from(bufA);

  for (let i = 33; i < blend.length - 12; i++) {
    blend[i] = Math.floor((bufA[i] + bufB[i]) / 2);
  }

  return blend;
}

/**
 * Creates a completely flat/blank image (zero variance) to trigger flat capture rejection.
 */
export function createFlatImagePng(value = 128, sizeBytes = 8192): Buffer {
  const buf = Buffer.alloc(sizeBytes);
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) buf[i] = pngSig[i];

  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(100, 16);
  buf.writeUInt32BE(100, 20);

  // Fill content with identical value
  for (let i = 33; i < buf.length - 12; i++) {
    buf[i] = value;
  }

  const endOffset = buf.length - 12;
  buf.writeUInt32BE(0, endOffset);
  buf.write('IEND', endOffset + 4, 'ascii');
  return buf;
}
