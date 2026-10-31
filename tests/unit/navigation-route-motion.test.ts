import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enterRoute, leaveRoute } from '@/navigation/route-motion';
import { setScene, withScene } from '@/scene/slot';
import type { Scene } from '@/scene';

function mountPage(): HTMLElement {
  document.body.innerHTML = '<div class="route-bar"></div><main><section class="sec">A</section></main>';
  return document.querySelector('main') as HTMLElement;
}

beforeEach(() => {
  document.documentElement.className = 'motion';
});

afterEach(() => {
  gsap.globalTimeline.clear();
  document.body.innerHTML = '';
  setScene(null);
});

describe('leaveRoute', () => {
  it('resolves at once without touching main when motion is off', async () => {
    document.documentElement.className = '';
    const main = mountPage();
    await leaveRoute(main, new AbortController().signal);
    expect(main.style.opacity).toBe('');
  });

  it('restores main when the leave is aborted', async () => {
    const main = mountPage();
    const control = new AbortController();
    const done = leaveRoute(main, control.signal);
    gsap.globalTimeline.progress(0.5);
    control.abort();
    await done;
    expect(main.style.opacity).toBe('');
    expect(main.style.visibility).toBe('');
  });

  it('enterRoute shows main again after a leave', () => {
    const main = mountPage();
    gsap.set(main, { autoAlpha: 0 });
    enterRoute(main);
    expect(main.style.opacity).toBe('');
  });
});

describe('scene slot', () => {
  it('runs queued work once the scene mounts', () => {
    const seen: string[] = [];
    withScene(() => seen.push('first'));
    expect(seen).toEqual([]);
    setScene({} as Scene);
    withScene(() => seen.push('second'));
    expect(seen).toEqual(['first', 'second']);
  });
});
