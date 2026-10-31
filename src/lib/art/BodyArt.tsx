import type { ReactElement } from 'react';
import { createRandom } from '@/lib/art/random';
import type { BodyKind } from '@/content/bodies';
import { LATTICE_EDGES, LATTICE_HUB, LATTICE_POINTS, NYX_POINTS, NYX_SEED, RIBBON_PATH } from '@/lib/art/body-geometry';
import { toSvg } from '@/lib/svg';
import { PALETTE, type Palette } from '@/lib/art/palette';

type Ctx = { s: number; c: number; t: Palette };

function Space({ s, c, t }: Ctx) {
  return (
    <>
      <defs>
        <radialGradient id="g">
          <stop offset="0" stopColor={t.atmo} stopOpacity="0.6" />
          <stop offset="0.4" stopColor={t.aurora2} stopOpacity="0.16" />
          <stop offset="0.7" stopColor={t.atmo} stopOpacity="0.08" />
          <stop offset="1" stopColor={t.atmo} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="core" cx="40%" cy="38%" r="70%">
          <stop offset="0" stopColor={t.accent} />
          <stop offset="0.3" stopColor={t.aurora1} />
          <stop offset="0.62" stopColor={t.atmo} />
          <stop offset="1" stopColor={t.night} />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={s * 0.48} fill="url(#g)" />
      <circle cx={c} cy={c} r={s * 0.22} fill="url(#core)" />
      <ellipse cx={c} cy={c} rx={s * 0.44} ry={s * 0.13} fill="none" stroke={t.accent} strokeOpacity="0.75" strokeWidth={Math.max(1, s * 0.006)} transform={`rotate(-18 ${c} ${c})`} />
      <ellipse cx={c} cy={c} rx={s * 0.36} ry={s * 0.105} fill="none" stroke={t.accent2} strokeOpacity="0.35" strokeWidth={Math.max(0.6, s * 0.004)} transform={`rotate(-18 ${c} ${c})`} />
    </>
  );
}

function DayDream({ s, c, t }: Ctx) {
  return (
    <>
      <defs>
        <linearGradient id="pr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.text} stopOpacity="0.18" />
          <stop offset="1" stopColor={t.text} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`${c - s * 0.28},${c + s * 0.3} ${c + s * 0.28},${c + s * 0.3} ${c},${c - s * 0.32}`} fill="url(#pr)" stroke={t.text} strokeOpacity="0.35" strokeWidth="1" />
      <line x1={c - s * 0.5} y1={c} x2={c - s * 0.1} y2={c + s * 0.02} stroke={t.text} strokeOpacity="0.55" strokeWidth="1" />
      <line x1={c + s * 0.12} y1={c + s * 0.04} x2={c + s * 0.5} y2={c - s * 0.06} stroke={t.accent} strokeWidth="1.2" />
      <line x1={c + s * 0.12} y1={c + s * 0.06} x2={c + s * 0.5} y2={c + s * 0.06} stroke={t.accent2} strokeWidth="1.2" />
      <line x1={c + s * 0.12} y1={c + s * 0.08} x2={c + s * 0.5} y2={c + s * 0.18} stroke={t.atmo} strokeWidth="1.2" />
    </>
  );
}

function Lunar({ s, c, t }: Ctx) {
  return (
    <>
      <defs>
        <radialGradient id="mo" cx="30%" cy="28%" r="75%">
          <stop offset="0" stopColor={t.elevated} />
          <stop offset="0.7" stopColor={t.surface} />
          <stop offset="1" stopColor={t.night} />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={s * 0.34} fill="url(#mo)" />
      <circle cx={c - s * 0.1} cy={c - s * 0.06} r={s * 0.05} fill={t.night} fillOpacity="0.6" />
      <circle cx={c + s * 0.08} cy={c + s * 0.12} r={s * 0.035} fill={t.night} fillOpacity="0.6" />
      <circle cx={c + s * 0.14} cy={c - s * 0.12} r={s * 0.025} fill={t.night} fillOpacity="0.5" />
      <circle cx={c} cy={c} r={s * 0.34} fill="none" stroke={t.text} strokeOpacity="0.5" strokeWidth={Math.max(0.8, s * 0.005)} strokeDasharray={`${s * 0.7} ${s * 2.2}`} transform={`rotate(200 ${c} ${c})`} />
    </>
  );
}

function DayLight({ s, c, t }: Ctx) {
  return (
    <>
      <defs>
        <linearGradient id="hz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={t.accent} stopOpacity="0" />
          <stop offset="0.5" stopColor={t.accent} />
          <stop offset="1" stopColor={t.accent} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hg">
          <stop offset="0" stopColor={t.accent} stopOpacity="0.35" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={s * 0.34} fill={t.night} stroke={t.text} strokeOpacity="0.08" strokeWidth="1" />
      <path d={`M ${c - s * 0.34} ${c} A ${s * 0.34} ${s * 0.34} 0 0 0 ${c + s * 0.34} ${c}`} fill="none" stroke="url(#hz)" strokeWidth={Math.max(1.5, s * 0.02)} strokeLinecap="round" />
      <ellipse cx={c} cy={c + s * 0.02} rx={s * 0.36} ry={s * 0.1} fill="url(#hg)" />
    </>
  );
}

function Solar({ s, c, t }: Ctx) {
  return (
    <>
      <defs>
        <radialGradient id="co">
          <stop offset="0" stopColor={t.text} stopOpacity="0.55" />
          <stop offset="0.3" stopColor={t.accent} stopOpacity="0.18" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={s * 0.46} fill="url(#co)" />
      <circle cx={c} cy={c} r={s * 0.09} fill={t.text} />
      <circle cx={c} cy={c} r={s * 0.13} fill="none" stroke={t.text} strokeOpacity="0.35" strokeWidth="1" />
    </>
  );
}

function AuroraBody({ s, t }: Ctx) {
  const { start, c1, c2, end } = RIBBON_PATH;
  const d = `M ${s * start[0]} ${s * start[1]} C ${s * c1[0]} ${s * c1[1]}, ${s * c2[0]} ${s * c2[1]}, ${s * end[0]} ${s * end[1]}`;
  return (
    <>
      <defs>
        <linearGradient id="au" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={t.accent2} stopOpacity="0.1" />
          <stop offset="0.5" stopColor={t.accent2} stopOpacity="0.8" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#au)" strokeWidth={Math.max(2, s * 0.06)} strokeLinecap="round" opacity="0.9" />
      <path d={d} fill="none" stroke={t.text} strokeOpacity="0.5" strokeWidth={Math.max(0.8, s * 0.008)} strokeLinecap="round" />
    </>
  );
}

function Umbra({ s, c, t }: Ctx) {
  return (
    <>
      <defs>
        <radialGradient id="ec">
          <stop offset="0.6" stopColor={t.accent} stopOpacity="0.5" />
          <stop offset="0.75" stopColor={t.accent} stopOpacity="0.12" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={s * 0.44} fill="url(#ec)" />
      <circle cx={c} cy={c} r={s * 0.3} fill={t.night} />
      <circle cx={c} cy={c} r={s * 0.3} fill="none" stroke={t.accent} strokeOpacity="0.9" strokeWidth={Math.max(0.8, s * 0.006)} />
    </>
  );
}

function Nyx({ s, c, t }: Ctx) {
  const rnd = createRandom(NYX_SEED);
  const dots = Array.from({ length: NYX_POINTS }, (_, i) => {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * s * 0.4;
    return {
      key: i,
      x: +(c + Math.cos(a) * d).toFixed(1),
      y: +(c + Math.sin(a) * d * 0.75).toFixed(1),
      r: +(0.4 + rnd() * 1.2).toFixed(2),
      tint: rnd() > 0.8 ? t.accent2 : t.text,
      o: +(0.3 + rnd() * 0.7).toFixed(2),
    };
  });
  return (
    <>
      <defs>
        <radialGradient id="ny">
          <stop offset="0" stopColor={t.accent2} stopOpacity="0.16" />
          <stop offset="1" stopColor={t.accent2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={s * 0.42} fill="url(#ny)" />
      {dots.map((p) => (
        <circle key={p.key} cx={p.x} cy={p.y} r={p.r} fill={p.tint} opacity={p.o} />
      ))}
    </>
  );
}

function LinkArchive({ s, t }: Ctx) {
  const pts = LATTICE_POINTS.map(([x, y]) => [x * s, y * s] as const);
  return (
    <>
      {LATTICE_EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke={t.text} strokeOpacity="0.35" strokeWidth={Math.max(0.6, s * 0.005)} />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={Math.max(1.4, s * 0.02)} fill={i === LATTICE_HUB ? t.accent : t.text} />
      ))}
    </>
  );
}

const RENDERERS: Record<BodyKind, (ctx: Ctx) => ReactElement> = {
  space: Space,
  daydream: DayDream,
  lunar: Lunar,
  daylight: DayLight,
  solar: Solar,
  aurora: AuroraBody,
  umbra: Umbra,
  nyx: Nyx,
  linkarchive: LinkArchive,
};

type Props = { kind: BodyKind; size: number };

export function BodyArt({ kind, size }: Props) {
  const Renderer = RENDERERS[kind];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Renderer s={size} c={size / 2} t={PALETTE} />
    </svg>
  );
}

export function bodySvg(kind: BodyKind, size: number): string {
  return toSvg(<BodyArt kind={kind} size={size} />);
}
