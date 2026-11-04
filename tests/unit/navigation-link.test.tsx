import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setActiveController } from '@/navigation/active';
import { TransitionLink } from '@/navigation/TransitionLink';

const glide = vi.hoisted(() => vi.fn());
vi.mock('@/motion/core', () => ({ glide }));

function mount(to: string) {
  const go = vi.fn(() => Promise.resolve());
  setActiveController({ go, interrupt: vi.fn(), busy: () => false });
  const Stub = createRoutesStub([{ path: '/', Component: () => <TransitionLink to={to}>link</TransitionLink> }]);
  render(<Stub initialEntries={['/']} />);
  return { go, link: screen.getByText('link') };
}

function clause(top: number): void {
  const section = document.createElement('section');
  section.id = 'clause';
  vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
  document.body.append(section);
}

afterEach(() => {
  setActiveController(null);
  glide.mockClear();
  vi.restoreAllMocks();
  document.getElementById('clause')?.remove();
});

describe('TransitionLink', () => {
  it('routes a plain click through the controller', () => {
    const { go, link } = mount('/projects');
    fireEvent.click(link, { button: 0 });
    expect(go).toHaveBeenCalledWith('/projects');
  });

  it('leaves modified clicks to the browser', () => {
    const { go, link } = mount('/projects');
    fireEvent.click(link, { button: 0, metaKey: true });
    expect(go).not.toHaveBeenCalled();
  });

  it('glides to the top on a click to the current route', () => {
    const { go, link } = mount('/');
    fireEvent.click(link, { button: 0 });
    expect(glide).toHaveBeenCalledWith(0);
    expect(go).not.toHaveBeenCalled();
  });

  it('glides to the hash target on a click to the current route with a hash', () => {
    clause(640);
    const { go, link } = mount('/#clause');
    fireEvent.click(link, { button: 0 });
    expect(glide).toHaveBeenCalledWith(640);
    expect(go).not.toHaveBeenCalled();
  });

  it('glides to the top when the hash on the current route names nothing', () => {
    const { go, link } = mount('/#missing');
    fireEvent.click(link, { button: 0 });
    expect(glide).toHaveBeenCalledWith(0);
    expect(go).not.toHaveBeenCalled();
  });

  it('keeps the hash when a click goes to another route', () => {
    const { go, link } = mount('/projects#clause');
    fireEvent.click(link, { button: 0 });
    expect(go).toHaveBeenCalledWith('/projects#clause');
    expect(glide).not.toHaveBeenCalled();
  });

  it('renders external hrefs as plain anchors', () => {
    const { go, link } = mount('https://discord.gg/night');
    expect(link.getAttribute('href')).toBe('https://discord.gg/night');
    fireEvent.click(link, { button: 0 });
    expect(go).not.toHaveBeenCalled();
  });
});
