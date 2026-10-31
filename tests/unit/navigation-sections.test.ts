import { describe, expect, it } from 'vitest';
import { currentSections, publishSections } from '@/navigation/sections';

function main(html: string): HTMLElement {
  const el = document.createElement('main');
  el.innerHTML = html;
  return el;
}

describe('publishSections', () => {
  it('labels sections from their headings or aria-label', () => {
    publishSections(main('<section data-frame="hero"><h1>We push</h1></section><div data-frame="statement"></div><section data-frame="list" aria-label="Projects"><h3>x</h3></section><section data-frame="related"><h2>Nearby</h2></section>'));
    expect(currentSections().map((s) => [s.index, s.label])).toEqual([
      [0, 'We push'],
      [1, ''],
      [2, 'Projects'],
      [3, 'Nearby'],
    ]);
  });

  it('replaces the list on every publish', () => {
    publishSections(main('<section data-frame="page"><h1>Community</h1></section>'));
    expect(currentSections()).toHaveLength(1);
  });
});
