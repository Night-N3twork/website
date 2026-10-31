import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOAD_TIMELINE, runIntro, T } from '@/motion/intro';

type Listener = () => void;

function fakeScene() {
  const listeners = new Map<string, Listener>();
  return {
    startIntro: vi.fn(),
    startMove: vi.fn(),
    on: vi.fn((event: string, fn: Listener) => {
      listeners.set(event, fn);
      return () => listeners.delete(event);
    }),
    fire: (event: string) => listeners.get(event)?.(),
  };
}

function mountLoader(): void {
  document.body.innerHTML = '<div id="veil"></div><div id="loader"><span class="loader-track"></span><span class="loader-count"></span></div>';
}

beforeEach(() => {
  mountLoader();
  document.documentElement.className = '';
});

afterEach(() => {
  gsap.globalTimeline.clear();
  document.body.innerHTML = '';
});

describe('runIntro', () => {
  it('resolves at once and marks intro-done when motion is off', async () => {
    const scene = fakeScene();
    await runIntro(scene, () => gsap.timeline({ paused: true }));
    expect(document.documentElement.classList.contains('intro-done')).toBe(true);
    expect(document.getElementById('veil')).toBeNull();
    expect(document.getElementById('loader')).toBeNull();
    expect(scene.startIntro).toHaveBeenCalledOnce();
  });

  it('speeds the load timeline up when the visitor scrolls', () => {
    document.documentElement.classList.add('motion');
    const scene = fakeScene();
    void runIntro(scene, () => gsap.timeline({ paused: true }));
    dispatchEvent(new WheelEvent('wheel'));
    expect(gsap.getById(LOAD_TIMELINE)?.timeScale()).toBe(T.skip);
  });

  it('plays the entrance when the scene lands and resolves after it', async () => {
    document.documentElement.classList.add('motion');
    const scene = fakeScene();
    const entrance = vi.fn(() => gsap.timeline({ paused: true }).to({}, { duration: 0.01 }));
    const done = runIntro(scene, entrance);
    scene.fire('intro:land');
    await done;
    expect(entrance).toHaveBeenCalledOnce();
    expect(document.documentElement.classList.contains('intro-done')).toBe(true);
  });
});
