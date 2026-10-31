import { describe, expect, it, vi } from 'vitest';
import { mountRouteMicro } from '@/motion/micro';

vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('fine'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined }));

describe('mountRouteMicro', () => {
  it('route micro listeners stop on abort', () => {
    const main = document.createElement('main');
    main.innerHTML = '<a class="row" href="/x"><span>x</span></a>';
    document.body.append(main);
    const nudge = vi.fn();
    const controller = new AbortController();
    mountRouteMicro(main, controller.signal, { nudge });
    const row = main.querySelector('a.row')!;
    row.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    expect(nudge).toHaveBeenCalledTimes(1);
    controller.abort();
    row.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    expect(nudge).toHaveBeenCalledTimes(1);
    main.remove();
  });
});
