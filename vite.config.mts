import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { docsMdx } from './src/lib/docs/mdx-plugin.ts';

const BACKDROPS = ['range', 'peak'];
const backdrop = process.env.GLASS_BACKDROP ?? 'range';
if (!BACKDROPS.includes(backdrop)) throw new Error(`GLASS_BACKDROP must be one of ${BACKDROPS.join(', ')}`);

const DOCS = fileURLToPath(new URL('./src/content/docs', import.meta.url));

export default defineConfig({
  plugins: [docsMdx(DOCS), reactRouter()],
  define: { __GLASS_BACKDROP__: JSON.stringify(backdrop) },
  build: { manifest: true, target: 'es2022' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
