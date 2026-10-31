import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router';
import { introFinished } from '@/motion/boot';
import { initMotion, jumpToTop, motionEnabled } from '@/motion/core';
import { withScene } from '@/scene/slot';
import { setActiveController } from './active';
import { publishSections } from './sections';
import { createCommitGate } from './commit-gate';
import { createController } from './controller';
import { enterRoute, leaveRoute, restoreRoute } from './route-motion';
import { routeName } from './route-name';

const COMMIT_TIMEOUT = 4000;
const commits = createCommitGate(COMMIT_TIMEOUT);
const finePointer = (): boolean => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

function focusHeading(): void {
  const heading = document.getElementById('page-heading');
  if (heading && document.activeElement !== heading) heading.focus({ preventScroll: true });
}

function useController(main: RefObject<HTMLElement | null>, pathname: string): void {
  const navigate = useNavigate();
  const path = useRef(pathname);
  useEffect(() => {
    path.current = pathname;
  }, [pathname]);
  useLayoutEffect(() => {
    const controller = createController({
      leave: (signal) => (main.current ? leaveRoute(main.current, signal) : Promise.resolve()),
      navigate: async (to) => {
        const committed = commits.next();
        await navigate(to);
        await committed;
      },
      enter: () => {
        if (main.current) enterRoute(main.current);
        focusHeading();
      },
    }, () => path.current);
    setActiveController(controller);
    const interrupt = (): void => controller.interrupt();
    addEventListener('popstate', interrupt);
    return () => {
      removeEventListener('popstate', interrupt);
      setActiveController(null);
    };
  }, [main, navigate]);
}

function finished(tl: gsap.core.Timeline): Promise<void> {
  if (tl.paused() || !tl.duration()) return Promise.resolve();
  return new Promise((resolve) => tl.eventCallback('onComplete', () => resolve()));
}

function enter(main: HTMLElement, home: boolean): Promise<void> {
  restoreRoute(main);
  jumpToTop();
  focusHeading();
  if (!motionEnabled()) return Promise.resolve();
  return import('@/motion/entrances').then(({ heroTimeline, pageTimeline }) => {
    const tl = home ? heroTimeline({ chrome: false }) : pageTimeline(main);
    tl.play();
    return finished(tl);
  });
}

export function useRouteMotion(main: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation();
  const home = routeName(useMatches()) === 'home';
  const entered = useRef<string | null>(null);
  useController(main, pathname);
  useLayoutEffect(() => {
    const el = main.current;
    if (!el) return;
    initMotion();
    const first = entered.current === null || entered.current === pathname;
    entered.current = pathname;
    const micro = new AbortController();
    let live = true;
    let chapters = (): void => undefined;
    const ctx = gsap.context((self: gsap.Context) => {
      const entered = first ? introFinished() : enter(el, home);
      if (motionEnabled()) {
        void Promise.all([import('@/motion/reveals'), import('@/motion/chapters')]).then(([{ buildRouteReveals }, { buildRouteChapters }]) => {
          if (live) {
            buildRouteReveals(el);
            chapters = buildRouteChapters(el, { entered, context: self });
          }
        });
      }
    }, el);
    if (finePointer()) {
      void import('@/motion/micro').then(({ mountRouteMicro }) => {
        if (!micro.signal.aborted) mountRouteMicro(el, micro.signal);
      });
    }
    withScene((scene) => {
      scene.setSections([...el.querySelectorAll<HTMLElement>('[data-frame]')], { home });
      if (!first) scene.nudge('route');
    });
    publishSections(el);
    if (!first) commits.signal();
    const refresh = first ? 0 : requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      live = false;
      cancelAnimationFrame(refresh);
      micro.abort();
      chapters();
      ctx.revert();
    };
  }, [main, pathname, home]);
}
