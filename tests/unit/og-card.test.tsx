import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { card, FONT } from '@/lib/og/card';

const SCENE = 'data:image/jpeg;base64,AAAA';
const images = (markup: string) => markup.match(/<img /g)?.length ?? 0;

describe('share card', () => {
  it('sets the type in Geist and never in the old display face', () => {
    const markup = renderToStaticMarkup(card({ title: 'Night Network', subtitle: 'Real software.', scene: SCENE }));
    expect(FONT).toBe('Geist');
    expect(markup).toContain('font-family:Geist');
    expect(markup).not.toContain('Unbounded');
  });

  it('lays the captured scene behind the text and shows the title and subtitle', () => {
    const markup = renderToStaticMarkup(card({ title: 'We push the browser to its limits.', subtitle: '6.5 million people a year.', scene: SCENE }));
    expect(markup).toContain(`src="${SCENE}"`);
    expect(markup).toContain('We push the browser to its limits.');
    expect(markup).toContain('6.5 million people a year.');
  });

  it('draws the scene and the brand mark on the site card, and adds a product tile only for a project', () => {
    const site = renderToStaticMarkup(card({ title: 'Night Network', subtitle: 's', scene: SCENE }));
    const project = renderToStaticMarkup(card({ title: 'Dusk', subtitle: 's', scene: SCENE, icon: 'dusk' }));
    expect(images(site)).toBe(2);
    expect(images(project)).toBe(3);
  });

  it('sizes a long title smaller than a short one', () => {
    const size = (title: string) => Number(/font-size:(\d+)px;line-height:1\.02;/.exec(renderToStaticMarkup(card({ title, subtitle: 's', scene: SCENE })))?.[1]);
    expect(size('Dusk')).toBeGreaterThan(size('We push the browser to its limits.'));
  });
});
