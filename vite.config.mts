import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

const BACKDROPS = ['range', 'peak'];
const backdrop = process.env.GLASS_BACKDROP ?? 'range';
if (!BACKDROPS.includes(backdrop)) throw new Error(`GLASS_BACKDROP must be one of ${BACKDROPS.join(', ')}`);

export default defineConfig({
  plugins: [reactRouter()],
  define: { __GLASS_BACKDROP__: JSON.stringify(backdrop) },
  build: { manifest: true, target: 'es2022' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
