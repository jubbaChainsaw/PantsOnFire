#!/usr/bin/env node
/**
 * Persona asset chroma key: flat #FF00FF magenta → alpha (sharp RGBA pass).
 * Used by generatePersonaAvatars.cjs and persona:key-chroma batch script.
 */
const sharp = require('sharp');

/** Default key: pure magenta (rare on clothing vs green). */
const DEFAULT_CHROMA_KEY_RGB = { r: 255, g: 0, b: 255 };

/** Default per-channel distance for strict box around key RGB. */
const DEFAULT_CHROMA_TOLERANCE = 58;

/**
 * Dark / anti-aliased magenta halos sit between pure #FF00FF and black ink: R and B stay
 * high while G is mid — they fail a tight box on (255,0,255). Catch only dim, purple-line
 * pixels to avoid eating saturated violet costume colors (usually brighter / higher sum).
 */
function isMagentaScreenFringe(r, g, b) {
  const sum = r + g + b;
  if (sum > 295) return false;
  if (r < 58 || b < 58) return false;
  if (g > 92) return false;
  if (Math.abs(r - b) > 48) return false;
  return (Math.min(r, b) - g) >= 30;
}

/**
 * @param {Buffer} imageBuffer
 * @param {{ tolerance?: number, keyR?: number, keyG?: number, keyB?: number, fringe?: boolean }} [options]
 * @returns {Promise<Buffer>} PNG buffer with keyed pixels transparent
 */
async function applyChromaKeyTransparency(imageBuffer, options = {}) {
  const tolerance = Number.isFinite(options.tolerance) ? options.tolerance : DEFAULT_CHROMA_TOLERANCE;
  const useFringe = options.fringe !== false;
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
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dr = Math.abs(r - keyR);
    const dg = Math.abs(g - keyG);
    const db = Math.abs(b - keyB);
    const strict = dr <= tolerance && dg <= tolerance && db <= tolerance;
    const fringe = useFringe && isMagentaScreenFringe(r, g, b);
    if (strict || fringe) {
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
  DEFAULT_CHROMA_TOLERANCE,
};
