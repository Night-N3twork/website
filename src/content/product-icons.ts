import type { ProductSlug } from '@/content/projects';

export type IconPaths = { readonly base: readonly string[]; readonly accent: readonly string[] };

const rect = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;

const circle = (cx: number, cy: number, r: number): string => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0z`;

export const PRODUCT_ICONS = {
  dusk: { base: [rect(3, 4, 18, 16, 2.5), 'M3 8.5h18', 'M7 12l3 2.5L7 17'], accent: ['M12.5 17h4.5'] },
  dpm: { base: ['M4 11v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8', 'M2.5 11h19l-2-4.5h-15z'], accent: ['M12 2.5v9', 'M9 8.5l3 3 3-3'] },
  moonbeam: { base: ['M2.5 12h7', 'M13.4 11.3l5.1-4.3', 'M13.5 12h6.5', 'M13.4 12.7l5.1 4.3', circle(19.8, 6, 1.2), circle(21.2, 12, 1.2), circle(19.8, 18, 1.2)], accent: [circle(11.5, 12, 2)] },
  eclipse: { base: [rect(3, 5, 13, 6, 1.5), rect(3, 13, 13, 6, 1.5), 'M6 8h.01M6 16h.01', 'M9 8h4M9 16h4'], accent: ['M18 5.5h3.5V9', 'M21.5 5.5l-4 4'] },
  luna: { base: [rect(6, 6, 12, 12, 2), 'M9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3'], accent: ['M13.6 9.4a3 3 0 1 0 0 5.2 2.6 2.6 0 0 1 0-5.2z'] },
  moonscale: { base: [circle(5.5, 17.5, 2.2), circle(18.5, 17.5, 2.2), 'M10.9 7.4L6.6 15.6M13.1 7.4l4.3 8.2M7.7 17.5h8.6'], accent: [circle(12, 5.5, 2.2)] },
  nova: { base: ['M2.5 7.5h19M2.5 16.5h19'], accent: ['M5 12h12', 'M14 9l3 3-3 3'] },
  umbra: { base: ['M4 10v4M7.5 7v10M14.5 8v8M18 10v4M21 11.5v1'], accent: ['M11 4v16'] },
  aurora: { base: [rect(2.5, 5, 19, 14, 2.5)], accent: ['M10 9.2v5.6l4.8-2.8z'] },
  nyxai: { base: ['M4 4.5h16A1.5 1.5 0 0 1 21.5 6v9.5A1.5 1.5 0 0 1 20 17h-9.5L6 20.5V17H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5z'], accent: ['M12 7.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z'] },
  solar: { base: ['M12 3l7.5 3v5.5c0 4.4-3.1 8.1-7.5 9.5-4.4-1.4-7.5-5.1-7.5-9.5V6z'], accent: ['M8.8 12.2l2.2 2.2 4.4-4.6'] },
  'link-archive': { base: ['M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1'], accent: ['M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1'] },
  ddx: { base: [rect(2.5, 3.5, 19, 17, 2.5), 'M2.5 7.5h19'], accent: [rect(7, 10.5, 10, 7, 1.2), 'M7 13h10'] },
  daylight: { base: [rect(3, 4, 18, 16, 2.5), 'M9 4v16'], accent: ['M5.5 8h1.5M5.5 11h1.5M5.5 14h1.5'] },
  space: { base: [circle(12, 12, 9), 'M3 12h18'], accent: ['M12 3c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3z'] },
  lunar: { base: [rect(3, 4, 18, 16, 2.5), 'M3 8.5h18', 'M8.5 4v4.5M13.5 4v4.5'], accent: ['M13.8 11.4a3.1 3.1 0 1 0 0 5.4 2.6 2.6 0 0 1 0-5.4z'] },
} as const satisfies Record<ProductSlug, IconPaths>;
