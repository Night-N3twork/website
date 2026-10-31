import { describe, expect, it } from 'vitest';
import { budgetChunks, findKey } from '../../scripts/budget-glass.mjs';

const manifest = {
  'entry.client.tsx': { file: 'assets/entry.js', isEntry: true, imports: ['_react.js'] },
  '_react.js': { file: 'assets/react.js' },
  'src/app/root.tsx': { file: 'assets/root.js', imports: ['_react.js', '_motion.js'], dynamicImports: ['src/scene/index.ts'], css: ['assets/root.css'] },
  '_motion.js': { file: 'assets/motion.js' },
  'src/scene/index.ts': { file: 'assets/scene.js', isDynamicEntry: true, imports: ['_three.js'] },
  '_three.js': { file: 'assets/three.js' },
  'src/app/routes/home.tsx': { file: 'assets/home.js', imports: ['_react.js'] },
};

describe('budgetChunks', () => {
  it('collects entries and their static imports once each', () => {
    const { eager } = budgetChunks(manifest, ['entry.client.tsx', 'src/app/root.tsx', 'src/app/routes/home.tsx']);
    expect(eager.sort()).toEqual(['assets/entry.js', 'assets/home.js', 'assets/motion.js', 'assets/react.js', 'assets/root.js']);
  });

  it('lists chunks reachable only through dynamic imports as lazy', () => {
    const { lazy } = budgetChunks(manifest, ['entry.client.tsx', 'src/app/root.tsx', 'src/app/routes/home.tsx']);
    expect(lazy.sort()).toEqual(['assets/scene.js', 'assets/three.js']);
  });

  it('throws when an entry is missing from the manifest', () => {
    expect(() => budgetChunks(manifest, ['nope.tsx'])).toThrow(/nope\.tsx/);
  });

  it('finds route chunks that carry a build query suffix', () => {
    expect(findKey({ 'src/app/routes/home.tsx?__react-router-build-client-route': { file: 'a.js' } }, 'src/app/routes/home.tsx')).toBe('src/app/routes/home.tsx?__react-router-build-client-route');
  });
});
