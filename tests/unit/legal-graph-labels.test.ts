import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import ja from '../../messages/ja.json';
import { GRAPH_EDGES, GRAPH_NODES } from '@/content/legal-graph';
import { type Box, frameBox, GRAPH_FRAMES, NODE_RADIUS, placeLabels, splitLabel, splitLabelInThree, textBox } from '@/lib/legal-graph-labels';
import { layoutGraph } from '@/lib/legal-graph-layout';

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const inside = (inner: Box, outer: Box) => inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
const hitsDot = (box: Box, dot: { x: number; y: number; r: number }) => {
  const nx = Math.min(Math.max(dot.x, box.left), box.right);
  const ny = Math.min(Math.max(dot.y, box.top), box.bottom);
  return Math.hypot(dot.x - nx, dot.y - ny) < dot.r;
};

describe('graph labels', () => {
  for (const [locale, file] of Object.entries({ en, es, fr, ja })) {
    for (const frame of Object.values(GRAPH_FRAMES)) {
      it(`keeps every ${locale} label clear of dots, other labels and the edge of the ${frame.name} frame`, () => {
        const labels = file.legal.graph.nodes as Record<string, string>;
        const points = layoutGraph(GRAPH_NODES, GRAPH_EDGES, frame.size);
        const placed = placeLabels(GRAPH_NODES, points, labels, frame);
        const boxes = GRAPH_NODES.map((node) => {
          const spot = placed[node.id];
          expect(spot.lines.join(' ').replace(/ /g, ''), node.id).toBe(labels[node.id].replace(/ /g, ''));
          return [node.id, textBox(spot.lines, spot.anchor, spot.x, spot.baseline, frame.font)] as const;
        });
        const dots = GRAPH_NODES.map((node) => ({ id: node.id, x: points[node.id].x, y: points[node.id].y, r: NODE_RADIUS[node.kind] }));
        const problems = boxes.flatMap(([id, box], index) => [
          ...(inside(box, frameBox(frame)) ? [] : [`${id} leaves the frame`]),
          ...dots.filter((dot) => hitsDot(box, dot)).map((dot) => `${id} covers the ${dot.id} dot`),
          ...boxes.slice(index + 1).filter(([, other]) => overlaps(box, other)).map(([other]) => `${id} overlaps the ${other} label`),
        ]);
        expect(problems).toEqual([]);
      });
    }
  }
});

describe('splitLabel', () => {
  it('breaks at the space nearest the middle', () => {
    expect(splitLabel('Registry and CDN')).toEqual(['Registry', 'and CDN']);
    expect(splitLabel('Bots de Discord')).toEqual(['Bots de', 'Discord']);
  });

  it('breaks unspaced Japanese at a script change or a word edge, never before small kana', () => {
    expect(splitLabel('Discordボット')).toEqual(['Discord', 'ボット']);
    expect(splitLabel('レジストリとCDN')).toEqual(['レジストリと', 'CDN']);
    expect(splitLabel('キャプチャ解決')).toEqual(['キャプチャ', '解決']);
    expect(splitLabel('キャプチャデータ')).toEqual(['キャプチャ', 'データ']);
  });

  it('leaves a single Latin word whole', () => {
    expect(splitLabel('Cloudflare')).toBeNull();
  });
});

describe('splitLabelInThree', () => {
  it('cuts at the two spaces that give the narrowest lines', () => {
    expect(splitLabelInThree('Captcha challenge data')).toEqual(['Captcha', 'challenge', 'data']);
    expect(splitLabelInThree('Night account and Night+')).toEqual(['Night', 'account', 'and Night+']);
  });

  it('has no three-line split for a label with fewer than two cut points', () => {
    expect(splitLabelInThree('Cloudflare')).toBeNull();
    expect(splitLabelInThree('Night account')).toBeNull();
  });
});
