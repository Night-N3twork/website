import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { claimFirstLoad, markIntroFinished } from '@/motion/boot';
import { initMotion, motionEnabled } from '@/motion/core';
import { runIntro } from '@/motion/intro';
import type { Scene } from '@/scene';
import { setScene } from '@/scene/slot';

const READY_TIMEOUT = 4500;

type IntroScene = Pick<Scene, 'startIntro' | 'startMove' | 'on'>;

const STILL_SCENE: IntroScene = { startIntro: () => undefined, startMove: () => undefined, on: () => () => undefined };

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function mount(canvas: HTMLCanvasElement): Promise<Scene | null> {
  try {
    const { mountScene } = await import('@/scene');
    return mountScene(canvas, { backdrop: __GLASS_BACKDROP__, still: !motionEnabled() });
  } catch {
    document.documentElement.dataset.scene = 'none';
    return null;
  }
}

function sceneReady(scene: Scene | null): Promise<void> {
  if (!scene) return Promise.resolve();
  return new Promise((resolve) => {
    scene.on('ready', () => {
      document.documentElement.dataset.scene = 'ready';
      resolve();
    });
  });
}

async function boot(canvas: HTMLCanvasElement): Promise<void> {
  try {
    if (!motionEnabled()) {
      document.getElementById('veil')?.remove();
      document.getElementById('loader')?.remove();
      initMotion();
      const scene = await mount(canvas);
      if (scene) {
        setScene(scene);
        scene.startIntro();
        void sceneReady(scene);
      }
      return;
    }
    initMotion();
    const scene = await mount(canvas);
    if (scene) setScene(scene);
    const [{ heroTimeline, pageTimeline }] = await Promise.all([
      import('@/motion/entrances'),
      Promise.race([Promise.all([sceneReady(scene), document.fonts.ready]), wait(READY_TIMEOUT)]),
    ]);
    const entrance = () => {
      const main = document.querySelector<HTMLElement>('main');
      if (document.body.dataset.route === 'home' || !main) return heroTimeline({ chrome: true });
      return pageTimeline(main);
    };
    await runIntro(scene ?? STILL_SCENE, entrance);
    const [{ buildGlobalChapters }, { buildGlobalReveals }] = await Promise.all([
      import('@/motion/chapters'),
      import('@/motion/reveals'),
    ]);
    buildGlobalChapters();
    buildGlobalReveals();
  } catch (error) {
    console.error(error);
  } finally {
    document.documentElement.classList.add('intro-done');
    markIntroFinished();
    ScrollTrigger.refresh();
  }
}

export function Stage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !claimFirstLoad()) return;
    void boot(el);
  }, []);
  return (
    <div className="stage" id="stage" aria-hidden="true">
      <canvas id="gl" ref={canvas} />
      <div className="scrim" />
    </div>
  );
}
