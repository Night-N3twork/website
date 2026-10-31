const HEX_PATTERN = /^#([0-9a-f]{6})$/i;
const SRGB_THRESHOLD = 0.04045;
const LUMINANCE_WEIGHTS = { r: 0.2126, g: 0.7152, b: 0.0722 } as const;
const CONTRAST_OFFSET = 0.05;

function channel(value: number): number {
  const v = value / 255;
  return v <= SRGB_THRESHOLD ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb {
  const match = HEX_PATTERN.exec(hex);
  if (!match) throw new Error(`expected 6-digit hex color, received "${hex}"`);
  const n = Number.parseInt(match[1], 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbLuminance({ r, g, b }: Rgb): number {
  return LUMINANCE_WEIGHTS.r * channel(r) + LUMINANCE_WEIGHTS.g * channel(g) + LUMINANCE_WEIGHTS.b * channel(b);
}

export function rgbContrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [rgbLuminance(a), rgbLuminance(b)].sort((x, y) => y - x);
  return (light + CONTRAST_OFFSET) / (dark + CONTRAST_OFFSET);
}

export function relativeLuminance(hex: string): number {
  return rgbLuminance(parseHex(hex));
}

export function contrastRatio(hexA: string, hexB: string): number {
  return rgbContrast(parseHex(hexA), parseHex(hexB));
}
