import { describe, expect, it } from 'vitest';
import { FRAMES, NARROW } from '@/scene/frames';
import { buildPath, dwell, rigProgress, scrollLift, sectionProgress, targetAt } from '@/scene/path';

const wide = { halfW: 5, halfH: 3, narrow: false };

describe('buildPath', () => {
  it('lets a frame set its own height on narrow screens', () => {
    const narrow = { ...wide, narrow: true };
    const [lost, page] = buildPath(['lost', 'page'], narrow).anchors;
    expect(lost.y).toBeCloseTo((FRAMES.lost.narrowY ?? 0) * narrow.halfH);
    expect(page.y).toBeCloseTo(NARROW.y * narrow.halfH);
  });

  it('uses only the given sections', () => {
    const { anchors, curve } = buildPath(['page', 'list'], wide);
    expect(anchors).toHaveLength(2);
    expect(anchors[0].x).toBeCloseTo(FRAMES.page.x * wide.halfW);
    expect(anchors[1].x).toBeCloseTo(FRAMES.list.x * wide.halfW);
    expect(curve).not.toBeNull();
  });

  it('has no curve for a single frame', () => {
    expect(buildPath(['lost'], wide).curve).toBeNull();
  });

  it('pins anchors to the narrow column on narrow viewports', () => {
    const { anchors } = buildPath(['products'], { ...wide, narrow: true });
    expect(anchors[0].x).toBeCloseTo(-NARROW.x * wide.halfW);
    expect(anchors[0].y).toBeCloseTo(NARROW.y * wide.halfH);
  });
});

describe('dwell', () => {
  it('holds at section centres and integers', () => {
    expect(dwell(0.5)).toBeCloseTo(0.5, 6);
    expect(dwell(2)).toBe(2);
    expect(dwell(1.05) - 1).toBeLessThan(0.05);
  });
});

describe('sectionProgress', () => {
  it('is zero above the first section and the last index below the last', () => {
    const spans: [number, number][] = [[400, 400], [1400, 1400]];
    expect(sectionProgress(spans, 300)).toBe(0);
    expect(sectionProgress(spans, 2000)).toBe(1);
    expect(sectionProgress(spans, 900)).toBeCloseTo(0.5);
    expect(sectionProgress([], 500)).toBe(0);
  });
});

describe('targetAt', () => {
  it('mixes scale and glow between frames', () => {
    const path = buildPath(['page', 'list'], wide);
    const target = targetAt(['page', 'list'], path, 0.5);
    expect(target.s).toBeCloseTo((FRAMES.page.s + FRAMES.list.s) / 2);
    expect(target.g).toBeCloseTo((FRAMES.page.g + FRAMES.list.g) / 2);
  });

  it('falls back to the origin with no frames', () => {
    const target = targetAt([], buildPath([], wide), 0);
    expect(target.point.length()).toBe(0);
    expect(target.s).toBe(1);
  });
});

describe('scrollLift', () => {
  it('keeps the glass on the first frame off home and lifts it with the page', () => {
    expect(rigProgress(false, 2.4)).toBe(0);
    expect(scrollLift({ home: false, scrolled: 450, lastTop: -900, halfH: 3, viewportHeight: 900 })).toBeCloseTo(3);
  });

  it('follows the sections on home and only lifts past the last one', () => {
    expect(rigProgress(true, 2.4)).toBe(2.4);
    expect(scrollLift({ home: true, scrolled: 4000, lastTop: 120, halfH: 3, viewportHeight: 900 })).toBe(0);
    expect(scrollLift({ home: true, scrolled: 4000, lastTop: -450, halfH: 3, viewportHeight: 900 })).toBeCloseTo(3);
  });
});
