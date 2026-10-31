import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'public', 'partners');
const SIZES = [96, 192];
const WEBP = { quality: 82, effort: 6 };

const sources = readdirSync(DIR).filter((file) => extname(file) === '.png');
for (const file of sources) {
  const id = basename(file, '.png');
  for (const size of SIZES) {
    const out = join(DIR, `${id}-${size}.webp`);
    await sharp(join(DIR, file)).resize(size, size, { fit: 'cover', kernel: 'lanczos3' }).webp(WEBP).toFile(out);
    console.info(`${id}-${size}.webp`);
  }
}
