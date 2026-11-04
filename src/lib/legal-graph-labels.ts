import type { GraphKind, GraphNode } from '@/content/legal-graph';
import type { GraphPoint, GraphSize } from './legal-graph-layout';

export type FrameName = 'wide' | 'tall';
export type GraphFrame = { name: FrameName; size: GraphSize; padX: number; padY: number; font: number; wrapEm: number };
export type Anchor = 'start' | 'middle' | 'end';
export type Box = { left: number; top: number; right: number; bottom: number };
export type LabelPlacement = { lines: string[]; anchor: Anchor; x: number; baseline: number; box: Box };

type Side = 'right' | 'left' | 'above' | 'below';
type Dot = { x: number; y: number; r: number };

export const GRAPH_FRAMES: Record<FrameName, GraphFrame> = {
  wide: { name: 'wide', size: { width: 860, height: 380 }, padX: 150, padY: 36, font: 12, wrapEm: 0 },
  tall: { name: 'tall', size: { width: 190, height: 500 }, padX: 80, padY: 34, font: 11.5, wrapEm: 6 },
};

export const NODE_RADIUS: Record<GraphKind, number> = { hub: 9, service: 6, party: 4.5, data: 3.5 };

export const LINE = 1.2;
const ASCENT = 1;
const DESCENT = 0.3;
const GAP = 7;
const PAD = 2;
const SIDE = 0.35;
const NARROW_EM = 0.6;
const NO_BREAK_BEFORE = new Set([...'ァィゥェォッャュョヮーぁぃぅぇぉっゃゅょゎ、。']);

const isWide = (char: string): boolean => (char.codePointAt(0) ?? 0) >= 0x2e80;
const scriptOf = (char: string): string => {
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x2e80) return 'latin';
  return code >= 0x3040 && code <= 0x30ff ? 'kana' : 'han';
};

export const textEm = (text: string): number => [...text].reduce((sum, char) => sum + (isWide(char) ? 1 : NARROW_EM), 0);

function cutPoints(chars: readonly string[]): { at: number; skip: number }[] {
  const spaces = chars.flatMap((char, at) => (char === ' ' ? [{ at, skip: 1 }] : []));
  if (spaces.length) return spaces;
  const allowed = chars.flatMap((char, at) => (at > 0 && !NO_BREAK_BEFORE.has(char) && (isWide(char) || isWide(chars[at - 1])) ? [{ at, skip: 0 }] : []));
  const scripts = allowed.filter(({ at }) => scriptOf(chars[at]) !== scriptOf(chars[at - 1]));
  return scripts.length ? scripts : allowed;
}

export function splitLabel(label: string): string[] | null {
  const chars = [...label];
  const half = textEm(label) / 2;
  const best = cutPoints(chars).reduce<{ at: number; skip: number; off: number } | null>((found, cut) => {
    const off = Math.abs(textEm(chars.slice(0, cut.at).join('')) - half);
    return found && found.off < off ? found : { ...cut, off };
  }, null);
  return best ? [chars.slice(0, best.at).join(''), chars.slice(best.at + best.skip).join('')] : null;
}

const widest = (lines: readonly string[]): number => Math.max(...lines.map(textEm));

export function splitLabelInThree(label: string): string[] | null {
  const chars = [...label];
  const cuts = cutPoints(chars);
  const candidates = cuts.flatMap((first, index) =>
    cuts.slice(index + 1).map((second) => [chars.slice(0, first.at).join(''), chars.slice(first.at + first.skip, second.at).join(''), chars.slice(second.at + second.skip).join('')]),
  );
  const whole = candidates.filter((lines) => lines.every((line) => line.length > 0));
  return whole.length ? whole.reduce((best, lines) => (widest(lines) < widest(best) ? lines : best)) : null;
}

export function textBox(lines: readonly string[], anchor: Anchor, x: number, baseline: number, font: number): Box {
  const width = Math.max(...lines.map(textEm)) * font;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
  const top = baseline - ASCENT * font;
  return { left, top, right: left + width, bottom: baseline + ((lines.length - 1) * LINE + DESCENT) * font };
}

export function frameBox(frame: GraphFrame): Box {
  return { left: -frame.padX, top: -frame.padY, right: frame.size.width + frame.padX, bottom: frame.size.height + frame.padY };
}

function sidesFor(point: GraphPoint, frame: GraphFrame): Side[] {
  const dx = (point.x - frame.size.width / 2) / (frame.size.width / 2);
  const dy = (point.y - frame.size.height / 2) / (frame.size.height / 2);
  const reach = Math.hypot(dx, dy);
  if (reach === 0) return ['below', 'above', 'right', 'left'];
  const [out, back]: Side[] = dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  const [up, down]: Side[] = dy < 0 ? ['above', 'below'] : ['below', 'above'];
  return Math.abs(dx) / reach > SIDE ? [out, up, down, back] : [up, out, back, down];
}

function placeAt(side: Side, nudge: number, lines: string[], point: GraphPoint, radius: number, font: number): LabelPlacement {
  const height = ((lines.length - 1) * LINE + ASCENT + DESCENT) * font;
  const width = Math.max(...lines.map(textEm)) * font;
  const across = side === 'above' || side === 'below';
  const top = side === 'above' ? point.y - radius - GAP - height : side === 'below' ? point.y + radius + GAP : point.y - height / 2 + nudge * (height / 2 + radius);
  const anchor: Anchor = side === 'right' ? 'start' : side === 'left' ? 'end' : 'middle';
  const x = (side === 'right' ? point.x + radius + GAP : side === 'left' ? point.x - radius - GAP : point.x) + (across ? nudge * (width / 2 - radius) : 0);
  const baseline = top + ASCENT * font;
  return { lines, anchor, x, baseline, box: textBox(lines, anchor, x, baseline, font) };
}

const grow = (box: Box): Box => ({ left: box.left - PAD, top: box.top - PAD, right: box.right + PAD, bottom: box.bottom + PAD });
const meets = (a: Box, b: Box): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const covers = (box: Box, dot: Dot): boolean =>
  Math.hypot(dot.x - Math.min(Math.max(dot.x, box.left), box.right), dot.y - Math.min(Math.max(dot.y, box.top), box.bottom)) < dot.r + PAD;
const within = (box: Box, outer: Box): boolean => box.left >= outer.left && box.right <= outer.right && box.top >= outer.top && box.bottom <= outer.bottom;

function variants(label: string, frame: GraphFrame): string[][] {
  const split = splitLabel(label);
  if (!split) return [[label]];
  return frame.wrapEm > 0 && textEm(label) > frame.wrapEm ? [split, [label]] : [[label], split];
}

function fallbackVariants(label: string, frame: GraphFrame): string[][] {
  const triple = frame.wrapEm > 0 ? splitLabelInThree(label) : null;
  return triple ? [triple] : [];
}

const NUDGES = [0, -1, 1];
const ORDER: Record<GraphKind, number> = { hub: 0, data: 1, party: 1, service: 2 };

export function placeLabels(nodes: readonly GraphNode[], points: Readonly<Record<string, GraphPoint>>, labels: Readonly<Record<string, string>>, frame: GraphFrame): Record<string, LabelPlacement> {
  const dots = nodes.map((node) => ({ ...points[node.id], r: NODE_RADIUS[node.kind] }));
  const edge = frameBox(frame);
  const queue = [...nodes].sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  const placed = queue.reduce<Record<string, LabelPlacement>>((done, node) => {
    const point = points[node.id];
    const options = [variants(labels[node.id], frame), fallbackVariants(labels[node.id], frame)].flatMap((sets) =>
      sidesFor(point, frame).flatMap((side) => sets.flatMap((lines) => NUDGES.map((nudge) => placeAt(side, nudge, lines, point, NODE_RADIUS[node.kind], frame.font)))),
    );
    const taken = Object.values(done).map((spot) => grow(spot.box));
    const clear = options.find(({ box }) => within(box, edge) && !dots.some((dot) => covers(box, dot)) && !taken.some((other) => meets(box, other)));
    return { ...done, [node.id]: clear ?? options[0] };
  }, {});
  return placed;
}
