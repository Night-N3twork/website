import { describe, expect, it } from 'vitest';
import { bodySvg } from '@/lib/art/BodyArt';
import { BODY_KINDS, type BodyKind } from '@/content/bodies';

const holder = (markup: string) => Object.assign(document.createElement('div'), { innerHTML: markup });
const art = (kind: BodyKind, size: number) => holder(bodySvg(kind, size));

describe('BodyArt', () => {
  it('draws the aurora along the path the ribbon geometry is built from', () => {
    expect(bodySvg('aurora', 120)).toContain('M 9.6 74.4 C 36 24, 60 108, 110.4 45.6');
  });

  it.each(BODY_KINDS)('draws %s inside a square viewBox sized by the prop', (kind) => {
    const svg = art(kind, 120).querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('gives Space a ring, NyxAI a point cloud and Link Archive a lattice', () => {
    expect(art('space', 100).querySelectorAll('ellipse')).toHaveLength(2);
    expect(art('nyx', 100).querySelectorAll('circle').length).toBeGreaterThan(80);
    expect(art('linkarchive', 100).querySelectorAll('line')).toHaveLength(9);
  });

  it('paints with literal palette colours so the art survives as a standalone image', () => {
    for (const kind of BODY_KINDS) {
      const svg = bodySvg(kind, 100);
      expect(svg).not.toContain('var(--');
      expect(svg).toMatch(/="#[0-9A-F]{6}"/);
    }
  });

  it('is deterministic between renders', () => {
    expect(bodySvg('nyx', 64)).toBe(bodySvg('nyx', 64));
  });
});
