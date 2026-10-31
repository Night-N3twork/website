import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'backdrops');
const MANIFEST_PATH = join(ROOT, 'src', 'scene', 'backdrops.json');

const SOURCES = {
  range: 'https://images.unsplash.com/photo-1574610758891-5b809b6e6e2e?w=2400&fm=png&fit=crop',
  peak: 'https://images.unsplash.com/photo-1765476608471-c30c09564def?w=2400&fm=png&fit=crop',
};

const SIZES = [2400, 1280];
const ENCODERS = {
  avif: (pipeline) => pipeline.avif({ quality: 76, effort: 6 }),
  webp: (pipeline) => pipeline.webp({ quality: 88, effort: 6 }),
};

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const manifest = {};

for (const [key, url] of Object.entries(SOURCES)) {
  manifest[key] = {};
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.statusText}`);
  const inputBuffer = Buffer.from(await res.arrayBuffer());

  for (const size of SIZES) {
    manifest[key][size] = {};
    for (const [format, encode] of Object.entries(ENCODERS)) {
      const buffer = await encode(sharp(inputBuffer).resize(size)).toBuffer();
      const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
      const filename = `${key}-${size}.${hash}.${format}`;
      const fullPath = join(OUT_DIR, filename);
      await writeFile(fullPath, buffer);
      const publicPath = `/backdrops/${filename}`;
      manifest[key][size][format] = publicPath;
      console.log(publicPath);
    }
  }
}

await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest written to ${MANIFEST_PATH}`);
