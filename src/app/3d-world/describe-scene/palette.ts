import * as THREE from "three";
import { hash01 } from "./compile";

// Color language for the stage. Descriptor color words always win; when a
// descriptor names no color, tints come from small curated palettes (seeded
// on entity id) instead of free HSL, so the cast and props share one look.

export const COLOR_WORDS: [RegExp, number][] = [
  [/\bnavy\b/, 0x2c3e63],
  [/\bblue\b/, 0x3b6ea5],
  [/\borange\b/, 0xd97a2b],
  [/\bred\b/, 0xb33a3a],
  [/\bgreen\b/, 0x3f7a44],
  [/\byellow\b/, 0xd9b832],
  [/\bbeige\b|\btan\b/, 0xcbb594],
  [/\bgrey\b|\bgray\b/, 0x8a8d93],
  [/\bblack\b/, 0x2b2e33],
  [/\bwhite\b/, 0xe8e8e4],
  [/\bbrown\b|\bleather\b|\bwood(en)?\b/, 0x6b4a2c],
  [/\bpink\b/, 0xd98ca6],
  [/\bpurple\b/, 0x7a5ba6],
];

/** Muted clothing/prop tints that sit well together under the stage light. */
export const CLOTHING_PALETTE = [
  0x3b6ea5, 0xb33a3a, 0x3f7a44, 0xd9b832,
  0x7a5ba6, 0xd97a2b, 0x4a7d7b, 0x8a8d93,
];

export const TROUSER_PALETTE = [0x2b2e33, 0x3a3f4a, 0x4a3a28, 0x565b63];

/** Believable skin range, light to deep. */
export const SKIN_TONES = [
  0xf1c6a7, 0xe3a983, 0xd99b6c, 0xc98a5e, 0xa9714b, 0x8d5a3b, 0x6f4530,
];

/** Natural hair/beard tones: black, dark brown, brown, auburn, blonde,
 *  sandy. Grey/white are reserved for elderly figures (see grooming). */
export const HAIR_TONES = [
  0x1c1a18, 0x3b2a1d, 0x5d4023, 0x6e3b27, 0xb78a4e, 0xc8a96a,
];
export const HAIR_GREY = 0x9a958c;

/** Deterministic palette pick, seeded so the same id always dresses alike. */
export function pick(palette: number[], seed: string): number {
  return palette[Math.floor(hash01(seed) * palette.length) % palette.length];
}

/** Color words in the text win; otherwise a seeded curated-palette tint. */
export function colorFromText(text: string, seed: string): number {
  const lower = text.toLowerCase();
  for (const [pattern, color] of COLOR_WORDS) {
    if (pattern.test(lower)) return color;
  }
  return pick(CLOTHING_PALETTE, `${seed}:hue`);
}

/** Darken a hex tint for accents (e.g. trousers from a jacket color). */
export function shade(color: number, factor: number): number {
  return new THREE.Color(color).multiplyScalar(factor).getHex();
}
