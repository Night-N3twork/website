import { createHash } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = join(ROOT, 'src', 'assets', 'shots');
const OUT_DIR = join(ROOT, 'public', 'shots');
const MANIFEST_PATH = join(ROOT, 'src', 'content', 'shots.json');

const RATIO = 16 / 10;
const WIDTHS = [960, 1600];
const INPUTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const SLUG = /^[a-z][a-z0-9-]*$/;
const ENCODERS = {
  avif: (pipeline) => pipeline.avif({ quality: 64, effort: 6 }),
  webp: (pipeline) => pipeline.webp({ quality: 84, effort: 6 }),
};

function frame({ width, height }) {
  return width / height > RATIO
    ? { width: Math.round(height * RATIO), height }
    : { width, height: Math.round(width / RATIO) };
}

async function encode(stem, path) {
  const crop = frame(await sharp(path).metadata());
  if (crop.width < Math.max(...WIDTHS)) console.warn(`${stem}: ${crop.width}px wide after cropping, below ${Math.max(...WIDTHS)}px`);
  const base = sharp(path).extract({ left: 0, top: 0, ...crop });
  const widths = [...new Set(WIDTHS.map((width) => Math.min(width, crop.width)))];
  const files = {};
  const outputs = [];
  for (const width of widths) {
    files[width] = {};
    for (const [format, encoder] of Object.entries(ENCODERS)) {
      const buffer = await encoder(base.clone().resize(width, Math.round(width / RATIO), { kernel: 'lanczos3' })).toBuffer();
      const name = `${stem}-${width}.${createHash('sha256').update(buffer).digest('hex').slice(0, 8)}.${format}`;
      files[width][format] = `/shots/${name}`;
      outputs.push({ name, buffer });
    }
  }
  const largest = Math.max(...widths);
  return { entry: { width: largest, height: Math.round(largest / RATIO), files }, outputs };
}

async function projects() {
  const dirs = (await readdir(SOURCE_DIR, { withFileTypes: true })).filter((item) => item.isDirectory()).map((item) => item.name).sort();
  const bad = dirs.filter((slug) => !SLUG.test(slug));
  if (bad.length) throw new Error(`Name each screenshot folder after its project slug: ${bad.join(', ')}`);
  const listed = await Promise.all(dirs.map(async (slug) => {
    const files = (await readdir(join(SOURCE_DIR, slug))).filter((file) => INPUTS.has(extname(file).toLowerCase())).sort();
    return { slug, files };
  }));
  return listed.filter(({ files }) => files.length);
}

const manifest = {};
const outputs = [];
for (const { slug, files } of await projects()) {
  manifest[slug] = [];
  for (const [i, file] of files.entries()) {
    const encoded = await encode(`${slug}-${String(i + 1).padStart(2, '0')}`, join(SOURCE_DIR, slug, file));
    manifest[slug].push(encoded.entry);
    outputs.push(...encoded.outputs);
  }
}

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
for (const { name, buffer } of outputs) {
  await writeFile(join(OUT_DIR, name), buffer);
  console.info(`/shots/${name}`);
}
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
const total = Object.values(manifest).reduce((n, list) => n + list.length, 0);
console.info(`${total} screenshots for ${Object.keys(manifest).length} projects in ${MANIFEST_PATH}`);
