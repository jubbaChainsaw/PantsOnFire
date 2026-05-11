#!/usr/bin/env node
/**
 * Persona asset chroma key: flat #FF00FF magenta → alpha (sharp RGBA pass).
 * Used by generatePersonaAvatars.cjs and persona:key-chroma batch script.
 */
const sharp = require('sharp');

/** Default key: pure magenta (rare on clothing vs green). */
const DEFAULT_CHROMA_KEY_RGB = { r: 255, g: 0, b: 255 };

/**
 * @param {Buffer} imageBuffer
 * @param {{ tolerance?: number, keyR?: number, keyG?: number, keyB?: number }} [options]
 * @returns {Promise<Buffer>} PNG buffer with keyed pixels transparent
 */
async function applyChromaKeyTransparency(imageBuffer, options = {}) {
  const tolerance = Number.isFinite(options.tolerance) ? options.tolerance : 42;
  const keyR = options.keyR ?? DEFAULT_CHROMA_KEY_RGB.r;
  const keyG = options.keyG ?? DEFAULT_CHROMA_KEY_RGB.g;
  const keyB = options.keyB ?? DEFAULT_CHROMA_KEY_RGB.b;

  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) {
    throw new Error(`Chroma key expected RGBA raw output, got ${info.channels} channels`);
  }

  const { width, height } = info;
  for (let i = 0; i < data.length; i += 4) {
    const dr = Math.abs(data[i] - keyR);
    const dg = Math.abs(data[i + 1] - keyG);
    const db = Math.abs(data[i + 2] - keyB);
    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

module.exports = {
  applyChromaKeyTransparency,
  DEFAULT_CHROMA_KEY_RGB,
};
