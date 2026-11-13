import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProductGroup, ProductSlug } from '@/content/projects';
import type { FilterValue } from '@/ui/glass/projects/Filter';
import { Shots, type ShotSlide } from '@/ui/glass/projects/Shots';

const IMAGE = { width: 1600, height: 1000, avif: '/a.avif 1600w', webp: '/a.webp 1600w', src: '/a.webp' };
const STAGES = { live: 'Live', beta: 'Beta', building: 'Building', planned: 'Planned' };
const COPY = { label: 'Screenshots', prev: 'Previous', next: 'Next' };
const STEP = 640;
const cleanups: (() => void)[] = [];

const slide = (slug: ProductSlug, group: ProductGroup, n: number): ShotSlide => ({ slug, group, n, name: slug.toUpperCase(), line: `${slug} line`, stage: 'beta', image: IMAGE });

const SLIDES = [slide('umbra', 'apps', 8), slide('nyxai', 'apps', 10), slide('ddx', 'browsers', 13)];

function renderShots(filter: FilterValue, slides: ShotSlide[] = SLIDES) {
  const Page = () => (
    <>
      <p>page</p>
      <Shots copy={COPY} slides={slides} filter={filter} stages={STAGES} />
    </>
  );
  const Stub = createRoutesStub([{ path: '/', Component: Page }]);
  return render(<Stub initialEntries={['/']} />);
}

function stubLayout(): ReturnType<typeof vi.fn> {
  const scrollTo = vi.fn();
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
    return this.parentElement ? [...this.parentElement.children].indexOf(this) * STEP : 0;
  });
  cleanups.push(() => (original ? Object.defineProperty(HTMLElement.prototype, 'scrollTo', original) : Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')));
  return scrollTo;
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanups.splice(0).forEach((undo) => undo());
});

describe('Shots', () => {
  it('links each screenshot to its project page in project order', async () => {
    renderShots('all');
    const region = await screen.findByRole('region', { name: 'Screenshots' });
    expect(within(region).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/projects/umbra', '/projects/nyxai', '/projects/ddx']);
  });

  it('sizes each image up front and lets the caption name the link', async () => {
    renderShots('all');
    const region = await screen.findByRole('region', { name: 'Screenshots' });
    const img = region.querySelector('img');
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '1000');
    expect(img).toHaveAttribute('alt', '');
    expect(within(region).getAllByRole('link')[0]).toHaveAccessibleName(/^08 UMBRA Beta umbra line/);
  });

  it('numbers each screenshot like its row in the index', async () => {
    renderShots('all');
    const region = await screen.findByRole('region', { name: 'Screenshots' });
    expect([...region.querySelectorAll('.shot-num')].map((el) => el.textContent)).toEqual(['08', '10', '13']);
  });

  it('shows only the screenshots in the filtered group', async () => {
    renderShots('apps');
    const region = await screen.findByRole('region', { name: 'Screenshots' });
    expect(within(region).getAllByRole('link')).toHaveLength(2);
  });

  it('drops the controls when one screenshot is left', async () => {
    renderShots('browsers');
    await screen.findByRole('region', { name: 'Screenshots' });
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
  });

  it('renders nothing when the filter leaves no screenshots', async () => {
    renderShots('platform');
    await screen.findByText('page');
    expect(screen.queryByRole('region', { name: 'Screenshots' })).toBeNull();
  });

  it('starts at the first screenshot', async () => {
    renderShots('all');
    expect(await screen.findByRole('button', { name: 'Previous' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'false');
  });

  it('scrolls the track by one slide on next', async () => {
    const scrollTo = stubLayout();
    renderShots('all');
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ left: STEP });
  });

  it('keeps focus on an arrow that reaches the end', async () => {
    stubLayout();
    renderShots('apps');
    const region = await screen.findByRole('region', { name: 'Screenshots' });
    const track = region.querySelector<HTMLElement>('.shots-track');
    const next = screen.getByRole('button', { name: 'Next' });
    next.focus();
    Object.defineProperty(track, 'scrollLeft', { configurable: true, value: STEP });
    fireEvent.scroll(track as HTMLElement);
    await vi.waitFor(() => expect(next).toHaveAttribute('aria-disabled', 'true'));
    expect(next).toHaveFocus();
  });
});
