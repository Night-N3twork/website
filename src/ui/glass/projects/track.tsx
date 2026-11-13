import { useEffect, useRef, useState } from 'react';
import type { ShotImage } from '@/content/shots';
import { motionEnabled } from '@/motion/core';
import { setReel } from '@/motion/reel';
import { Chevron, pad, Reel } from '../parts';

export interface TrackCopy {
  prev: string;
  next: string;
}

interface ControlsProps {
  id: string;
  copy: TrackCopy;
  active: number;
  total: number;
  go: (direction: 1 | -1) => void;
}

interface PictureProps {
  image: ShotImage;
  sizes: string;
  alt: string;
  eager: boolean;
}

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value));

function stepOf(track: HTMLElement): number {
  const [first, second] = track.children as HTMLCollectionOf<HTMLElement>;
  return first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
}

export function useTrack(count: number) {
  const track = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const read = (): void => {
      frame = 0;
      const step = stepOf(el);
      setActive(step ? clamp(Math.round(el.scrollLeft / step), count - 1) : 0);
    };
    const onScroll = (): void => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [count]);
  const go = (direction: 1 | -1): void => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: clamp(active + direction, count - 1) * stepOf(el), behavior: motionEnabled() ? 'smooth' : 'auto' });
  };
  return { track, active, go };
}

function useCounter(active: number) {
  const counter = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reel = counter.current?.querySelector('.reel');
    if (reel) setReel(reel, pad(active + 1), { instant: !motionEnabled() });
  }, [active]);
  return counter;
}

export function TrackControls({ id, copy, active, total, go }: ControlsProps) {
  const counter = useCounter(active);
  return (
    <div className="shots-bar">
      <span className="shots-count" aria-hidden="true" ref={counter}>
        <Reel text="01" className="shots-reel" />
        <span className="shots-total">/ {pad(total)}</span>
      </span>
      <div className="shots-nav cut">
        <button type="button" className="shots-btn is-prev" aria-label={copy.prev} aria-controls={id} aria-disabled={active === 0} onClick={() => go(-1)}>
          <Chevron />
        </button>
        <button type="button" className="shots-btn" aria-label={copy.next} aria-controls={id} aria-disabled={active === total - 1} onClick={() => go(1)}>
          <Chevron />
        </button>
      </div>
    </div>
  );
}

export function ShotPicture({ image, sizes, alt, eager }: PictureProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={image.avif} sizes={sizes} />
      <img src={image.src} srcSet={image.webp} sizes={sizes} width={image.width} height={image.height} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </picture>
  );
}
