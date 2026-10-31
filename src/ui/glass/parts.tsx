import type { CSSProperties, ReactNode } from 'react';
import type { Stage } from '@/content/projects';
import { TransitionLink } from '@/navigation/TransitionLink';

const MARK = { outer: 0.29, inner: 0.235, dx: 0.115, dy: -0.06, corner: 0.24 };

export const pad = (n: number): string => String(n).padStart(2, '0');

export function Mark({ size, id }: { size: number; id: string }) {
  const c = size / 2;
  return (
    <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <mask id={id}>
          <rect width={size} height={size} fill="white" />
          <circle className="mark-shadow" cx={c + size * MARK.dx} cy={c + size * MARK.dy} r={size * MARK.inner} fill="black" />
        </mask>
      </defs>
      <rect className="mark-frame" x={0.5} y={0.5} width={size - 1} height={size - 1} rx={size * MARK.corner} />
      <circle cx={c} cy={c} r={size * MARK.outer} fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg className="chev" width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
      <path className="chev-stem" d="M2.5 7h8.5" />
      <path className="chev-arm chev-up" d="M11 7 7.25 3.25" />
      <path className="chev-arm chev-down" d="M11 7 7.25 10.75" />
    </svg>
  );
}

export function Chip({ stage, label }: { stage: Stage; label: string }) {
  return (
    <span className="chip" data-stage={stage}>
      {label}
    </span>
  );
}

function Roll({ text }: { text: string }) {
  return (
    <span className="roll">
      <span className="roll-a">{text}</span>
      <span className="roll-b" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}

export function Button({ kind, to, children }: { kind: 'primary' | 'ghost'; to: string; children: string }) {
  const external = /^https?:/.test(to) ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <TransitionLink className={`btn btn-${kind}`} to={to} data-magnetic="" {...external}>
      <span className="btn-sheen" aria-hidden="true" />
      <Roll text={children} />
      <Chevron />
    </TransitionLink>
  );
}

function ReelChar({ ch }: { ch: string }) {
  if (!/\d/.test(ch)) return <span className="reel-char">{ch}</span>;
  return (
    <span className="reel-digit">
      <span className="reel-strip" data-d={ch} style={{ '--d': ch } as CSSProperties}>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i}>{i % 10}</span>
        ))}
      </span>
    </span>
  );
}

export function Reel({ text, className, label = text }: { text: string; className: string; label?: string }) {
  return (
    <span className={`reel ${className}`}>
      <span className="sr-only">{label}</span>
      <span className="reel-track" aria-hidden="true">
        {[...text].map((ch, i) => (
          <ReelChar key={i} ch={ch} />
        ))}
      </span>
    </span>
  );
}

export function Section({ frame, look, side, children, ...rest }: { frame: string; look?: string; side: 'left' | 'right' | 'center'; children: ReactNode; id?: string; 'aria-labelledby'?: string; 'aria-label'?: string }) {
  return (
    <section className={`sec sec-${look ?? frame}`} data-frame={frame} data-side={side} {...rest}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow" data-reveal="">
      {children}
    </p>
  );
}

export function Glare() {
  return <span className="tilt-glare" aria-hidden="true" />;
}

export interface RowItem {
  slug: string;
  name: string;
  line: string;
  stage: Stage;
}

export function Row({ item, stage }: { item: RowItem; stage: string }) {
  return (
    <li>
      <TransitionLink className="row" to={`/projects/${item.slug}`}>
        <span className="row-name">{item.name}</span>
        <span className="row-line">{item.line}</span>
        <Chip stage={item.stage} label={stage} />
        <Chevron />
      </TransitionLink>
    </li>
  );
}
