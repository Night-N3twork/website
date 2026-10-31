import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { type Rgb, rgbContrast } from '../../../src/lib/color/contrast';

type Box = { left: number; top: number; width: number; height: number };
type Ink = Rgb & { a: number };
type Target = { label: string; ink: Ink; lines: Box[] };
export type Reading = { label: string; ratio: number };

const STILL = '* { transition: none !important; }';
const HIDE_TEXT = '* { color: transparent !important; -webkit-text-fill-color: transparent !important; }';
const SETTLE_TIMEOUT = 15_000;
const SETTLE_GAP = 250;
const SETTLE_CHANGED = 0.001;
const STEP = 2;
const LOW_PERCENTILE = 0.1;

function targets(page: Page, selector: string): Promise<Target[]> {
  return page.evaluate((selector) => {
    const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
    const parse = (color: string) => {
      if (!ctx) throw new Error('no 2d canvas to resolve colours');
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    };
    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((el) => el.checkVisibility())
      .map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const lines = Array.from(range.getClientRects())
          .filter((r) => r.width > 2 && r.top >= 0 && r.bottom <= window.innerHeight)
          .map((r) => ({ left: r.left, top: r.top, width: r.width, height: r.height }));
        return { label: `${el.className}: ${el.textContent?.trim().slice(0, 30)}`, ink: parse(getComputedStyle(el).color), lines };
      })
      .filter((t) => t.lines.length > 0);
  }, selector);
}

function blend(ink: Ink, under: Rgb): Rgb {
  const mix = (top: number, bottom: number) => top * ink.a + bottom * (1 - ink.a);
  return { r: mix(ink.r, under.r), g: mix(ink.g, under.g), b: mix(ink.b, under.b) };
}

function lowRatio(pixels: { data: Buffer; width: number; height: number; channels: number }, target: Target): number {
  const ratios: number[] = [];
  for (const line of target.lines) {
    for (let y = Math.floor(line.top); y < Math.min(line.top + line.height, pixels.height); y += STEP) {
      for (let x = Math.floor(line.left); x < Math.min(line.left + line.width, pixels.width); x += STEP) {
        const i = (y * pixels.width + x) * pixels.channels;
        const under = { r: pixels.data[i], g: pixels.data[i + 1], b: pixels.data[i + 2] };
        ratios.push(rgbContrast(blend(target.ink, under), under));
      }
    }
  }
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length * LOW_PERCENTILE)] ?? Number.POSITIVE_INFINITY;
}

const frames = (page: Page): Promise<unknown> => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));

async function changed(a: Buffer, b: Buffer): Promise<number> {
  const [pa, pb] = await Promise.all([sharp(a).raw().toBuffer({ resolveWithObject: true }), sharp(b).raw().toBuffer({ resolveWithObject: true })]);
  const step = pa.info.channels;
  let count = 0;
  for (let i = 0; i < pa.data.length; i += step) if (Math.abs(pa.data[i] - pb.data[i]) + Math.abs(pa.data[i + 1] - pb.data[i + 1]) + Math.abs(pa.data[i + 2] - pb.data[i + 2]) > 6) count += 1;
  return count / (pa.data.length / step);
}

export async function sceneSettled(page: Page): Promise<void> {
  const deadline = Date.now() + SETTLE_TIMEOUT;
  let last = await page.screenshot({ scale: 'css' });
  while (Date.now() < deadline) {
    await page.waitForTimeout(SETTLE_GAP);
    const next = await page.screenshot({ scale: 'css' });
    if ((await changed(last, next)) < SETTLE_CHANGED) return;
    last = next;
  }
  throw new Error('the scene never settled');
}

export async function backdropContrast(page: Page, selector: string): Promise<Reading[]> {
  await sceneSettled(page);
  const still = await page.addStyleTag({ content: STILL });
  const found = await targets(page, selector);
  const hide = await page.addStyleTag({ content: HIDE_TEXT });
  await frames(page);
  const png = await page.screenshot({ scale: 'css' });
  await hide.evaluate((style) => style.parentNode?.removeChild(style));
  await still.evaluate((style) => style.parentNode?.removeChild(style));
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const pixels = { data, width: info.width, height: info.height, channels: info.channels };
  return found.map((target) => ({ label: target.label, ratio: Number(lowRatio(pixels, target).toFixed(2)) }));
}
