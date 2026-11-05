import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { card, FONT, type CardInput } from '@/lib/og/card';

const SCENE = 'data:image/jpeg;base64,AAAA';
const LOGO = 'data:image/png;base64,BBBB';
const draw = (input: Omit<CardInput, 'scene' | 'logo'>) => renderToStaticMarkup(card({ ...input, scene: SCENE, logo: LOGO }));
const images = (markup: string) => markup.match(/<img /g)?.length ?? 0;

describe('share card', () => {
  it('sets the type in Geist and never in the old display face', () => {
    const markup = draw({ title: 'Night Network', subtitle: 'Real software.' });
    expect(FONT).toBe('Geist');
    expect(markup).toContain('font-family:Geist');
    expect(markup).not.toContain('Unbounded');
  });

  it('lays the captured scene behind the text and shows the title and subtitle', () => {
    const markup = draw({ title: 'Dusk', subtitle: 'Node-style processes in one tab.' });
    expect(markup).toContain(`src="${SCENE}"`);
    expect(markup).toContain('Dusk');
    expect(markup).toContain('Node-style processes in one tab.');
  });

  it('brands the card with the supplied logo, not a drawn mark', () => {
    const markup = draw({ title: 'Night Network' });
    expect(markup).toContain(`src="${LOGO}"`);
    expect(markup).not.toContain('image/svg+xml');
  });

  it('draws only the headline when there is no subtitle', () => {
    const markup = draw({ title: 'We push the browser to its limits.' });
    expect(markup).toContain('We push the browser to its limits.');
    expect(markup).not.toContain('million');
    expect(markup.match(/font-size:28px/g)).toBeNull();
  });

  it('draws the scene and the logo on the site card, and adds a product tile only for a project', () => {
    const site = draw({ title: 'Night Network' });
    const project = draw({ title: 'Dusk', subtitle: 's', icon: 'dusk' });
    expect(images(site)).toBe(2);
    expect(images(project)).toBe(3);
  });

  it('sizes a long title smaller than a short one', () => {
    const size = (title: string) => Number(/font-size:(\d+)px;line-height:1\.02;/.exec(draw({ title }))?.[1]);
    expect(size('Dusk')).toBeGreaterThan(size('We push the browser to its limits.'));
  });
});
