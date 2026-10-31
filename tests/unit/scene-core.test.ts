import { describe, expect, it, vi } from 'vitest';
import { createSceneCore } from '@/scene/core';

function section(frame: string, top: number, height: number): HTMLElement {
  const el = document.createElement('section');
  el.dataset.frame = frame;
  el.getBoundingClientRect = () => ({ top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) });
  return el;
}

describe('createSceneCore', () => {
  it('targets the first section of an inner route at the top', () => {
    const core = createSceneCore();
    core.setSections([section('page', 0, 700), section('list', 700, 1200)], { home: false });
    expect(core.frameTarget(450)).toBe('page');
    expect(core.home()).toBe(false);
  });

  it('ignores unknown frame names', () => {
    const core = createSceneCore();
    core.setSections([section('nope', 0, 700), section('detail', 700, 900)], { home: false });
    expect(core.frames()).toEqual(['detail']);
  });

  it('stops calling a listener after unsubscribe', () => {
    const core = createSceneCore();
    const fn = vi.fn();
    const off = core.on('ready', fn);
    core.emit('ready');
    off();
    core.emit('ready');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('replays ready to listeners that subscribe after it fired', () => {
    const core = createSceneCore();
    core.emit('ready');
    const fn = vi.fn();
    core.on('ready', fn);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not replay non-sticky events', () => {
    const core = createSceneCore();
    core.emit('intro:land');
    const fn = vi.fn();
    core.on('intro:land', fn);
    expect(fn).not.toHaveBeenCalled();
  });
});
