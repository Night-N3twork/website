import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderAsync } from '@resvg/resvg-js';
import satori from 'satori';
import { card, FONT, type CardInput } from './card';
import { OG_SIZE } from './size';

export { OG_SIZE };

const FONT_FILE = 'src/assets/fonts/Unbounded-Bold-Latin.ttf';
const OG_HEADERS = { 'content-type': 'image/png', 'cache-control': 'public, max-age=0, must-revalidate' } as const;

const font = await readFile(join(process.cwd(), FONT_FILE));
const drawn = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

async function draw(input: CardInput): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(card(input), { ...OG_SIZE, fonts: [{ name: FONT, data: font, style: 'normal', weight: 700 }] });
  const png = await renderAsync(svg, { fitTo: { mode: 'width', value: OG_SIZE.width } });
  return new Uint8Array(png.asPng());
}

function drawOnce(input: CardInput): Promise<Uint8Array<ArrayBuffer>> {
  const key = JSON.stringify([input.title, input.subtitle, input.icon ?? null]);
  const known = drawn.get(key);
  if (known) return known;
  const pending = draw(input);
  drawn.set(key, pending);
  pending.catch(() => drawn.delete(key));
  return pending;
}

export async function ogImage(input: CardInput): Promise<Response> {
  return new Response(await drawOnce(input), { headers: OG_HEADERS });
}
