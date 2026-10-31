import { type RefObject, useEffect, useLayoutEffect } from 'react';

export type PillAxis = 'x' | 'y';

export function slidePill(pill: HTMLElement, target: HTMLElement, instant = false, axis: PillAxis = 'x'): void {
  const transform = axis === 'x' ? `translate3d(${target.offsetLeft}px, 0, 0) scaleX(${target.offsetWidth})` : `translate3d(0, ${target.offsetTop}px, 0)`;
  if (!instant && pill.dataset.placed) {
    pill.style.transform = transform;
    return;
  }
  pill.style.transition = 'none';
  if (axis === 'y') pill.style.height = `${target.offsetHeight}px`;
  pill.style.transform = transform;
  void pill.offsetWidth;
  pill.style.transition = '';
  pill.dataset.placed = 'true';
}

function placePill(pill: RefObject<HTMLElement | null>, list: RefObject<HTMLElement | null>, selector: string, instant: boolean): void {
  const target = list.current?.querySelector<HTMLElement>(selector);
  if (pill.current && target) slidePill(pill.current, target, instant);
}

export function usePill(pill: RefObject<HTMLElement | null>, list: RefObject<HTMLElement | null>, selector: string, key: string): void {
  useLayoutEffect(() => placePill(pill, list, selector, false), [pill, list, selector, key]);
  useEffect(() => {
    const onResize = (): void => placePill(pill, list, selector, true);
    void document.fonts?.ready.then(onResize);
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, [pill, list, selector]);
}
