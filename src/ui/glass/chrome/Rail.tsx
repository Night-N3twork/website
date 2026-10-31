import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { glide } from '@/motion/core';
import { useSections } from '@/navigation/sections';
import { pad } from '../parts';

function useRailTriggers(fill: RefObject<HTMLSpanElement | null>, onActive: (index: number, on: boolean) => void): void {
  const sections = useSections();
  useEffect(() => {
    if (!sections.length) return;
    const triggers = sections.map((section) => ScrollTrigger.create({ trigger: section.el, start: 'top center', end: 'bottom center', onToggle: (self) => onActive(section.index, self.isActive) }));
    triggers.push(ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => fill.current?.style.setProperty('transform', `scaleY(${self.progress.toFixed(4)})`) }));
    return () => triggers.forEach((trigger) => trigger.kill());
  }, [sections, fill, onActive]);
}

export function Rail({ label }: { label: string }) {
  const sections = useSections();
  const fill = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const onActive = useCallback((index: number, on: boolean) => setActive((current) => (on ? index : current === index ? null : current)), []);
  useRailTriggers(fill, onActive);
  return (
    <nav className="rail" aria-label={label}>
      <span className="rail-track" aria-hidden="true">
        <span className="rail-fill" ref={fill} />
      </span>
      <ol>
        {sections.map((section) => (
          <li key={`${section.index}-${section.label}`}>
            <button type="button" className={`rail-tick${active === section.index ? ' is-active' : ''}`} aria-label={section.label || pad(section.index + 1)} onClick={() => glide(section.el)}>
              <span className="rail-num">{pad(section.index + 1)}</span>
              <span className="tip" aria-hidden="true">
                {section.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
