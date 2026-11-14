import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useMatches, useNavigate, useNavigationType } from 'react-router';
import { introFinished } from '@/motion/boot';
import { initMotion, jumpTo, jumpToTop, motionEnabled } from '@/motion/core';
import { withScene } from '@/scene/slot';
import { setActiveController } from './active';
import { hashTarget, hashTop } from './hash-target';
import { publishSections } from './sections';
import { createCommitGate } from './commit-gate';
import { createController } from './controller';
import { enterRoute, leaveRoute, restoreRoute } from './route-motion';
import { routeName } from './route-name';
import { createScrollMemory } from './scroll-memory';

const COMMIT_TIMEOUT = 4000;
const commits = createCommitGate(COMMIT_TIMEOUT);
const scrolls = createScrollMemory();
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

const SETTLE_FRAMES = 60;

function settleAt(top: number, alive: () => boolean, frame = 0): void {
  if (!alive()) return;
  const room = document.documentElement.scrollHeight - innerHeight;
  if (room >= top || frame >= SETTLE_FRAMES) {
    jumpTo(top);
    return;
  }
  requestAnimationFrame(() => settleAt(top, alive, frame + 1));
}

function finished(tl: gsap.core.Timeline): Promise<void> {
  if (tl.paused() || !tl.duration()) return Promise.resolve();
  return new Promise((resolve) => tl.eventCallback('onComplete', () => resolve()));
}

function enter(main: HTMLElement, home: boolean, hash: string, restored: number | null): Promise<void> {
  restoreRoute(main);
  const target = hashTarget(hash);
  if (target) jumpTo(hashTop(target));
  else if (restored !== null) jumpTo(restored);
  else jumpToTop();
  focusHeading();
  if (!motionEnabled()) return Promise.resolve();
  return import('@/motion/entrances').then(({ heroTimeline, pageTimeline }) => {
    const tl = home ? heroTimeline({ chrome: false }) : pageTimeline(main);
    tl.play();
    return finished(tl);
  });
}

export function useRouteMotion(main: RefObject<HTMLElement | null>): void {
  const { pathname, hash, key } = useLocation();
  const kind = useNavigationType();
  const home = routeName(useMatches()) === 'home';
  const entered = useRef<string | null>(null);
  const landing = useRef(hash);
  const visit = useRef({ key, kind });
  useController(main, pathname);
  useLayoutEffect(() => {
    landing.current = hash;
  }, [hash]);
  useLayoutEffect(() => {
    visit.current = { key, kind };
  }, [key, kind]);
  useLayoutEffect(() => {
    const el = main.current;
    if (!el) return;
    initMotion();
    const first = entered.current === null || entered.current === pathname;
    entered.current = pathname;
    const here = visit.current;
    const restored = first ? null : scrolls.restore(here.key, here.kind);
    let lastY = scrollY;
    const track = (): void => void (lastY = scrollY);
    addEventListener('scroll', track, { passive: true });
    const micro = new AbortController();
    let live = true;
    let chapters = (): void => undefined;
    const ctx = gsap.context((self: gsap.Context) => {
      const entered = first ? introFinished() : enter(el, home, landing.current, restored);
      if (motionEnabled()) {
        void import('@/motion/reveals').then(({ buildRouteReveals }) => {
          if (live) self.add(() => buildRouteReveals(el));
        });
      }
      void import('@/motion/chapters').then(({ buildRouteChapters }) => {
        if (live) self.add(() => void (chapters = buildRouteChapters(el, { entered, context: self })));
      });
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
    const refresh = first
      ? 0
      : requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          if (restored !== null && !hashTarget(landing.current)) settleAt(restored, () => live);
        });
    return () => {
      removeEventListener('scroll', track);
      scrolls.save(here.key, lastY);
      live = false;
      cancelAnimationFrame(refresh);
      micro.abort();
      chapters();
      ctx.revert();
    };
  }, [main, pathname, home]);
}
