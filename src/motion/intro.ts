import gsap from 'gsap';
import type { Scene } from '@/scene';
import { holdScroll, motionEnabled, releaseScroll } from './core';

export const T = { veil: 0.9, move: 2.5, land: 1.4, skip: 4, heroSkip: 2 };
export const LOAD_TIMELINE = 'intro-load';
const SKIP_EVENTS = ['wheel', 'keydown', 'touchstart'] as const;

type IntroScene = Pick<Scene, 'startIntro' | 'startMove' | 'on'>;

const byId = (id: string): HTMLElement | null => document.getElementById(id);

function finish(): void {
  document.documentElement.classList.add('intro-done');
  releaseScroll();
}

function removeLoader(): void {
  byId('veil')?.remove();
  byId('loader')?.remove();
}

function takeLoader(loader: HTMLElement): { bar: { f: number }; write: () => void } {
  const bar = { f: parseFloat(getComputedStyle(loader).getPropertyValue('--f')) || 0 };
  loader.style.animation = 'none';
  const write = (): void => {
    loader.style.setProperty('--f', bar.f.toFixed(4));
    loader.style.setProperty('--p', String(Math.round(bar.f * 100)));
  };
  write();
  return { bar, write };
}

function loadTimeline(scene: IntroScene, veil: HTMLElement, loader: HTMLElement): gsap.core.Timeline {
  const { bar, write } = takeLoader(loader);
  veil.style.animation = 'none';
  return gsap.timeline({ id: LOAD_TIMELINE })
    .call(() => scene.startIntro(), undefined, 0)
    .to(veil, { autoAlpha: 0, duration: T.veil, ease: 'power2.out' }, 0.05)
    .to(bar, { f: 1, duration: T.move, ease: 'power1.inOut', onUpdate: write }, 0)
    .addLabel('move', T.move)
    .call(() => scene.startMove(), undefined, 'move')
    .to(loader.querySelector('.loader-track'), { scaleX: 0, transformOrigin: '100% 50%', duration: 0.5, ease: 'power3.in' }, 'move')
    .to(loader.querySelector('.loader-count'), { autoAlpha: 0, y: 6, duration: 0.3, ease: 'power2.in' }, 'move')
    .call(removeLoader);
}

export function runIntro(scene: IntroScene, entrance: () => gsap.core.Timeline): Promise<void> {
  const veil = byId('veil');
  const loader = byId('loader');
  if (!motionEnabled() || !veil || !loader) {
    removeLoader();
    scene.startIntro();
    finish();
    return Promise.resolve();
  }
  holdScroll();
  return new Promise((resolve) => {
    const skipper = new AbortController();
    const load = loadTimeline(scene, veil, loader);
    let hero: gsap.core.Timeline | null = null;
    const land = (): void => {
      if (hero) return;
      hero = entrance();
      hero.eventCallback('onComplete', () => {
        skipper.abort();
        finish();
        resolve();
      });
      hero.timeScale(load.timeScale() > 1 ? T.heroSkip : 1).play();
    };
    const skip = (): void => {
      load.timeScale(T.skip);
      hero?.timeScale(T.heroSkip);
    };
    SKIP_EVENTS.forEach((type) => addEventListener(type, skip, { passive: true, signal: skipper.signal }));
    const off = scene.on('intro:land', () => {
      off();
      land();
    });
    load.call(() => setTimeout(land, (T.land * 1000) / load.timeScale()), undefined, 'move');
  });
}
