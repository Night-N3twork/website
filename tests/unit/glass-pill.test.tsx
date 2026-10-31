import { act, useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { usePill } from '@/ui/glass/pill';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const writes: string[] = [];

function Tabs({ selected }: { selected: string }) {
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = pill.current;
    if (!el || el.dataset.watched) return;
    el.dataset.watched = 'true';
    Object.defineProperty(el.style, 'transition', { configurable: true, get: () => '', set: (v: string) => void writes.push(v) });
  }, []);
  usePill(pill, list, '[aria-selected="true"]', selected);
  return (
    <div ref={list}>
      <span ref={pill} className="tabs-pill" />
      {['a', 'b'].map((key) => (
        <button key={key} type="button" role="tab" aria-selected={key === selected}>
          {key}
        </button>
      ))}
    </div>
  );
}

afterEach(() => {
  writes.length = 0;
  document.body.innerHTML = '';
});

describe('usePill', () => {
  it('slides to a new tab instead of snapping once fonts are ready', async () => {
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<Tabs selected="a" />));
    writes.length = 0;
    await act(async () => root.render(<Tabs selected="b" />));
    expect(writes).not.toContain('none');
    act(() => root.unmount());
  });
});
