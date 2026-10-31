import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const BUDGET = 163_840;
const CLIENT = 'build/client';
const ROUTES = ['src/app/root.tsx', 'src/app/routes/home.tsx'];

function walk(manifest, keys, follow) {
  const seen = new Set();
  const stack = [...keys];
  while (stack.length) {
    const key = stack.pop();
    if (seen.has(key)) continue;
    const chunk = manifest[key];
    if (!chunk) throw new Error(`budget: ${key} is not in the manifest`);
    seen.add(key);
    stack.push(...follow(chunk));
  }
  return seen;
}

export function budgetChunks(manifest, entries) {
  const eagerKeys = walk(manifest, entries, (chunk) => chunk.imports ?? []);
  const dynamicRoots = [...eagerKeys].flatMap((key) => manifest[key].dynamicImports ?? []);
  const reachable = walk(manifest, dynamicRoots, (chunk) => [...(chunk.imports ?? []), ...(chunk.dynamicImports ?? [])]);
  const file = (key) => manifest[key].file;
  return {
    eager: [...eagerKeys].map(file),
    lazy: [...reachable].filter((key) => !eagerKeys.has(key)).map(file),
  };
}

export function findKey(manifest, name) {
  const key = Object.keys(manifest).find((candidate) => candidate === name || candidate.startsWith(`${name}?`) || candidate.endsWith(`/${name}`));
  if (!key) throw new Error(`budget: ${name} is not in the manifest`);
  return key;
}

const gzipped = (file) => gzipSync(readFileSync(join(CLIENT, file))).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function main() {
  const manifest = JSON.parse(readFileSync(join(CLIENT, '.vite/manifest.json'), 'utf8'));
  const entry = Object.keys(manifest).find((key) => manifest[key].isEntry && key.includes('entry.client'));
  if (!entry) throw new Error('budget: no entry.client chunk in the manifest');
  const { eager, lazy } = budgetChunks(manifest, [entry, ...ROUTES.map((route) => findKey(manifest, route))]);
  const total = eager.reduce((sum, file) => sum + gzipped(file), 0);
  eager.forEach((file) => process.stdout.write(`eager ${kb(gzipped(file)).padStart(9)}  ${file}\n`));
  lazy.forEach((file) => process.stdout.write(`lazy  ${kb(gzipped(file)).padStart(9)}  ${file}\n`));
  process.stdout.write(`total before the headline: ${kb(total)} of ${kb(BUDGET)}\n`);
  if (total > BUDGET) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
