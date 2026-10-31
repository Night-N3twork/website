import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = process.env.LH_BASE ?? 'http://localhost:3000';
const OUT_DIR = '.lighthouse';
const LCP_LIMIT_MS = 2500;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const TARGETS = [
  { path: '/', performance: 80, accessibility: 100, seo: 100, 'best-practices': 95 },
  { path: '/projects', performance: 80, accessibility: 100, seo: 100, 'best-practices': 95 },
  { path: '/projects/space', performance: 90, accessibility: 100, seo: 100, 'best-practices': 95 },
  { path: '/community', performance: 90, accessibility: 100, seo: 100, 'best-practices': 95 },
];
const PRESETS = ['desktop', 'mobile'];
const cli = createRequire(import.meta.url).resolve('lighthouse/cli/index.js');

function audit(target, preset) {
  const out = `${OUT_DIR}/${target.path === '/' ? 'home' : target.path.slice(1).replace(/\//g, '-')}-${preset}.json`;
  const args = [cli, `${BASE}${target.path}`, '--output=json', `--output-path=${out}`, '--quiet', '--chrome-flags=--headless=new', `--only-categories=${CATEGORIES.join(',')}`];
  if (preset === 'desktop') args.push('--preset=desktop');
  const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (run.status !== 0) {
    console.error(`lighthouse failed for ${target.path} (${preset})`);
    return false;
  }
  const report = JSON.parse(readFileSync(out, 'utf8'));
  let ok = true;
  for (const category of CATEGORIES) {
    const score = Math.round((report.categories[category]?.score ?? 0) * 100);
    const pass = score >= target[category];
    ok &&= pass;
    console.log(`${pass ? 'PASS' : 'FAIL'} ${target.path} ${preset} ${category} ${score} (min ${target[category]})`);
  }
  if (target.path !== '/') return ok;
  const lcp = Math.round(report.audits['largest-contentful-paint']?.numericValue ?? 0);
  const lcpOk = lcp <= LCP_LIMIT_MS;
  console.log(`${lcpOk ? 'PASS' : 'FAIL'} ${target.path} ${preset} LCP ${lcp} ms (max ${LCP_LIMIT_MS})`);
  return ok && lcpOk;
}

mkdirSync(OUT_DIR, { recursive: true });
const results = TARGETS.flatMap((target) => PRESETS.map((preset) => audit(target, preset)));
process.exit(results.every(Boolean) ? 0 : 1);
