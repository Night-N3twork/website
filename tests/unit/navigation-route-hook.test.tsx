import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { createRoutesStub, Outlet } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const entered = vi.hoisted(() => [] as string[]);
vi.mock('@/navigation/route-motion', () => ({
  leaveRoute: () => Promise.resolve(),
  enterRoute: () => entered.push(document.querySelector('h1')?.textContent ?? ''),
  restoreRoute: () => undefined,
}));
import type { Scene } from '@/scene';
import { activeController } from '@/navigation/active';
import { TransitionLink } from '@/navigation/TransitionLink';
import { useRouteMotion } from '@/navigation/useRouteMotion';
import { setScene } from '@/scene/slot';

function Shell() {
  const main = useRef<HTMLElement>(null);
  useRouteMotion(main);
  return (
    <main ref={main}>
      <Outlet />
    </main>
  );
}

function Page({ title, to, clause = false }: { title: string; to: string; clause?: boolean }) {
  return (
    <section data-frame="hero">
      <h1 id="page-heading" tabIndex={-1}>{title}</h1>
      <TransitionLink to={to}>next</TransitionLink>
      {clause ? <section id="clause">Clause</section> : null}
    </section>
  );
}

function fakeScene() {
  return { setSections: vi.fn(), nudge: vi.fn() } as unknown as Scene & { setSections: ReturnType<typeof vi.fn>; nudge: ReturnType<typeof vi.fn> };
}

vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));

afterEach(() => {
  vi.restoreAllMocks();
  setScene(null);
  document.documentElement.className = '';
});

describe('useRouteMotion', () => {
  it('hands sections to the scene, then nudges and focuses on each route change', async () => {
    const scene = fakeScene();
    setScene(scene);
    const Stub = createRoutesStub([
      {
        Component: Shell,
        children: [
          { path: '/', id: 'home', loader: () => ({}), Component: () => <Page title="Home" to="/projects" /> },
          { path: '/projects', id: 'projects', loader: () => ({}), Component: () => <Page title="Projects" to="/" /> },
        ],
      },
    ]);
    render(<Stub initialEntries={['/']} />);
    await screen.findByText('Home');
    expect(scene.setSections).toHaveBeenLastCalledWith([expect.any(HTMLElement)], { home: true });
    expect(scene.nudge).not.toHaveBeenCalled();
    expect(activeController()).not.toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByText('next'));
    });
    await screen.findByText('Projects');
    expect(scene.setSections).toHaveBeenLastCalledWith([expect.any(HTMLElement)], { home: false });
    expect(scene.nudge).toHaveBeenCalledWith('route');
    expect(document.activeElement?.textContent).toBe('Projects');
    await vi.waitFor(() => expect(entered).toEqual(['Projects']));
  });

  describe('scroll after a route change', () => {
    const CLAUSE_TOP = 480;

    async function visit(to: string) {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        return { top: this.id === 'clause' ? CLAUSE_TOP : 0 } as DOMRect;
      });
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
      const Stub = createRoutesStub([
        {
          Component: Shell,
          children: [
            { path: '/', id: 'home', loader: () => ({}), Component: () => <Page title="Home" to={to} /> },
            { path: '/projects', id: 'projects', loader: () => ({}), Component: () => <Page title="Projects" to="/" clause /> },
          ],
        },
      ]);
      render(<Stub initialEntries={['/']} />);
      await screen.findByText('Home');
      scrollTo.mockClear();
      await act(async () => {
        fireEvent.click(screen.getByText('next'));
      });
      await screen.findByText('Projects');
      return scrollTo;
    }

    it('lands on the element a hash names and leaves focus on the heading', async () => {
      const scrollTo = await visit('/projects#clause');
      expect(scrollTo).toHaveBeenCalledWith(0, CLAUSE_TOP);
      expect(scrollTo).not.toHaveBeenCalledWith(0, 0);
      expect(document.activeElement?.textContent).toBe('Projects');
    });

    it('still lands at the top when there is no hash', async () => {
      const scrollTo = await visit('/projects');
      expect(scrollTo).toHaveBeenCalledWith(0, 0);
      expect(scrollTo).not.toHaveBeenCalledWith(0, CLAUSE_TOP);
    });

    it('lands at the top when the hash names nothing on the new page', async () => {
      const scrollTo = await visit('/projects#missing');
      expect(scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });
});
