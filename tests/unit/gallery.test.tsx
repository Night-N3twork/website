import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ShotImage } from '@/content/shots';
import { Gallery } from '@/ui/glass/projects/Gallery';

const image = (name: string): ShotImage => ({ width: 1600, height: 1000, avif: `/${name}.avif 1600w`, webp: `/${name}.webp 1600w`, src: `/${name}.webp` });
const IMAGES = [image('a'), image('b'), image('c')];
const copy = (total: number) => ({
  label: 'Screenshots',
  prev: 'Previous screenshot',
  next: 'Next screenshot',
  alts: Array.from({ length: total }, (_, i) => `Space, screenshot ${i + 1} of ${total}`),
});

describe('Gallery', () => {
  it('renders nothing without screenshots', () => {
    const { container } = render(<Gallery copy={copy(0)} images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the section with its heading and describes every screenshot', () => {
    render(<Gallery copy={copy(3)} images={IMAGES} />);
    const region = screen.getByRole('region', { name: 'Screenshots' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Screenshots' })).toBeInTheDocument();
    expect(within(region).getByRole('list', { name: 'Screenshots' })).toHaveAttribute('tabindex', '0');
    const imgs = within(region).getAllByRole('img');
    expect(imgs.map((img) => img.getAttribute('alt'))).toEqual(['Space, screenshot 1 of 3', 'Space, screenshot 2 of 3', 'Space, screenshot 3 of 3']);
    expect(imgs[0]).toHaveAttribute('loading', 'eager');
    expect(imgs[1]).toHaveAttribute('loading', 'lazy');
    expect(imgs[2]).toHaveAttribute('width', '1600');
  });

  it('starts on the first screenshot with both arrows wired to the track', () => {
    render(<Gallery copy={copy(3)} images={IMAGES} />);
    const prev = screen.getByRole('button', { name: 'Previous screenshot' });
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Next screenshot' })).toHaveAttribute('aria-disabled', 'false');
    expect(document.getElementById(prev.getAttribute('aria-controls') ?? '')).toHaveClass('gallery-track');
  });

  it('drops the arrows for a single screenshot', () => {
    render(<Gallery copy={copy(1)} images={[IMAGES[0]]} />);
    expect(screen.getByRole('region', { name: 'Screenshots' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('list', { name: 'Screenshots' })).not.toHaveAttribute('tabindex');
  });
});
