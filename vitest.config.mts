import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

const NODE_TESTS = 'tests/unit/**/*.node.test.ts';

export default defineConfig({
  plugins: [react()],
  test: {
    pool: 'vmThreads',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/i18n/**', 'src/content/**'],
      thresholds: { lines: 80 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/unit/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, NODE_TESTS],
          setupFiles: ['tests/setup.ts'],
          testTimeout: 15_000,
        },
      },
      {
        extends: true,
        test: { name: 'node', environment: 'node', pool: 'forks', include: [NODE_TESTS], testTimeout: 30_000 },
      },
    ],
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
