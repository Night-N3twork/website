import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderAsync } from '@resvg/resvg-js';
import satori from 'satori';
import { card, FONT, type CardInput } from './card';
import { OG_SIZE } from './size';

export { OG_SIZE };

const FONT_FILES = [
  { file: 'src/assets/fonts/Geist-Regular-Latin.woff', weight: 400 },
  { file: 'src/assets/fonts/Geist-SemiBold-Latin.woff', weight: 600 },
] as const;
const SCENE_FILE = 'src/assets/og/night-scene.jpg';
const LOGO_FILE = 'src/assets/og/night-logo.png';
const OG_HEADERS = { 'content-type': 'image/png', 'cache-control': 'public, max-age=0, must-revalidate' } as const;

export type OgInput = Omit<CardInput, 'scene' | 'logo'>;

const fonts = await Promise.all(
  FONT_FILES.map(async ({ file, weight }) => ({ name: FONT, data: await readFile(join(process.cwd(), file)), style: 'normal' as const, weight })),
);
const scene = `data:image/jpeg;base64,${(await readFile(join(process.cwd(), SCENE_FILE))).toString('base64')}`;
const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), LOGO_FILE))).toString('base64')}`;
const drawn = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

async function draw(input: OgInput): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(card({ ...input, scene, logo }), { ...OG_SIZE, fonts });
  const png = await renderAsync(svg, { fitTo: { mode: 'width', value: OG_SIZE.width } });
  return new Uint8Array(png.asPng());
}

function drawOnce(input: OgInput): Promise<Uint8Array<ArrayBuffer>> {
  const key = JSON.stringify([input.title, input.subtitle ?? null, input.icon ?? null]);
  const known = drawn.get(key);
  if (known) return known;
  const pending = draw(input);
  drawn.set(key, pending);
  pending.catch(() => drawn.delete(key));
  return pending;
}

export async function ogImage(input: OgInput): Promise<Response> {
  return new Response(await drawOnce(input), { headers: OG_HEADERS });
}
