import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/content/projects';
import { SHOTS, shotOf, shotsOf, showcase, srcset, type ShotEntry } from '@/content/shots';

const entry = (name: string): ShotEntry => ({
  width: 1600,
  height: 1000,
  files: {
    '1600': { avif: `/shots/${name}-1600.avif`, webp: `/shots/${name}-1600.webp` },
    '960': { avif: `/shots/${name}-960.avif`, webp: `/shots/${name}-960.webp` },
  },
});

const MAIN = entry('main');
const SECOND = entry('second');

describe('shots', () => {
  it('lists widths smallest first in a srcset', () => {
    expect(srcset(MAIN, 'avif')).toBe('/shots/main-960.avif 960w, /shots/main-1600.avif 1600w');
    expect(srcset(MAIN, 'webp')).toBe('/shots/main-960.webp 960w, /shots/main-1600.webp 1600w');
  });

  it('follows the index order and numbering, not the manifest order', () => {
    const shown = showcase({ lunar: [MAIN], umbra: [MAIN], dusk: [MAIN] });
    expect(shown.map(({ project, n }) => [project.slug, n])).toEqual([
      ['dusk', 1],
      ['umbra', 8],
      ['lunar', 16],
    ]);
  });

  it('skips manifest keys that are not projects and projects with an empty list', () => {
    expect(showcase({ nope: [MAIN], umbra: [MAIN], dusk: [] }).map(({ project }) => project.slug)).toEqual(['umbra']);
  });

  it('shows the first screenshot as the main one, with its intrinsic size and smallest webp fallback', () => {
    expect(shotOf('umbra', { umbra: [MAIN, SECOND] })).toEqual({
      width: 1600,
      height: 1000,
      avif: '/shots/main-960.avif 960w, /shots/main-1600.avif 1600w',
      webp: '/shots/main-960.webp 960w, /shots/main-1600.webp 1600w',
      src: '/shots/main-960.webp',
    });
  });

  it('lists every screenshot of a project in order', () => {
    expect(shotsOf('umbra', { umbra: [MAIN, SECOND] }).map((image) => image.src)).toEqual(['/shots/main-960.webp', '/shots/second-960.webp']);
  });

  it('has nothing for a project without screenshots', () => {
    expect(shotOf('dusk', { umbra: [MAIN] })).toBeNull();
    expect(shotsOf('dusk', { umbra: [MAIN] })).toEqual([]);
  });

  it('ships only 16:10 screenshots of known projects', () => {
    const slugs = new Set<string>(PROJECTS.map((project) => project.slug));
    for (const [slug, entries] of Object.entries(SHOTS)) {
      expect(slugs.has(slug), slug).toBe(true);
      expect(entries.length, slug).toBeGreaterThan(0);
      for (const shot of entries) {
        expect(Math.abs(shot.width / shot.height - 1.6), slug).toBeLessThan(0.01);
        expect(Object.values(shot.files).filter(Boolean).length, slug).toBeGreaterThan(0);
        for (const file of Object.values(shot.files)) expect([file?.avif, file?.webp].every((path) => path?.startsWith(`/shots/${slug}-`)), slug).toBe(true);
      }
    }
  });
});
