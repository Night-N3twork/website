import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'assets', 'og', 'night-scene.jpg');
const URL = process.env.OG_SCENE_URL ?? 'http://127.0.0.1:3000/';
const SIZE = { width: 1200, height: 630 };
const SETTLE_MS = 10_000;
const HIDE = 'a.skip,#veil,#loader,header,main,footer,nav.rail,.cursor,.grain,.route-bar{visibility:hidden!important}';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME,
  args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(SETTLE_MS);
await page.addStyleTag({ content: HIDE });
await page.waitForTimeout(800);
const png = await page.screenshot({ type: 'png' });
await browser.close();

await mkdir(dirname(OUT), { recursive: true });
const info = await sharp(png).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(OUT);
console.info(`${OUT} ${info.width}x${info.height} ${info.size} bytes`);
