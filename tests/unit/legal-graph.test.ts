import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import ja from '../../messages/ja.json';
import { GRAPH_EDGES, GRAPH_NODES, nodeRelations } from '@/content/legal-graph';
import { layoutGraph } from '@/lib/legal-graph-layout';

describe('legal graph data', () => {
  it('points every edge at real nodes and every node at a real Privacy section', () => {
    const ids = new Set(GRAPH_NODES.map((n) => n.id));
    for (const e of GRAPH_EDGES) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
    for (const n of GRAPH_NODES) expect(en.legal.privacy.order).toContain(n.clause);
  });

  it('labels every node in all four locale files, not by falling back to English', () => {
    for (const [locale, file] of Object.entries({ en, es, fr, ja })) {
      for (const n of GRAPH_NODES) expect((file.legal.graph.nodes as Record<string, unknown>)[n.id], `${locale}:${n.id}`).toBeTypeOf('string');
    }
  });

  it('carries the graph words in all four locale files', () => {
    for (const [locale, file] of Object.entries({ en, es, fr, ja })) {
      for (const key of ['heading', 'listHeading', 'collects', 'shares', 'separator'] as const) expect(file.legal.graph[key], `${locale}:${key}`).toBeTypeOf('string');
    }
    expect(ja.legal.graph.separator).toBe('、');
    for (const file of [en, es, fr]) expect(file.legal.graph.separator).toBe(', ');
  });

  it('states the facts the policy rests on', () => {
    expect(nodeRelations('libraries')).toEqual({ collects: [], sharedWith: [] });
    expect(nodeRelations('wireguard').collects).toEqual([]);
    expect(nodeRelations('website').sharedWith.map((n) => n.id).sort()).toEqual(['cloudflare', 'google']);
    expect(nodeRelations('account').collects.map((n) => n.id).sort()).toEqual(['discord-id', 'email', 'synced-data']);
  });

  it('names every third party the policy lists and connects every node', () => {
    expect(GRAPH_NODES.filter((n) => n.kind === 'party').map((n) => n.id)).toEqual(['cloudflare', 'google', 'discord', 'patreon', 'cash-app', 'mullvad', 'two-captcha']);
    const touched = new Set(GRAPH_EDGES.flatMap((e) => [e.from, e.to]));
    for (const n of GRAPH_NODES.filter((node) => node.kind === 'data' || node.kind === 'party')) expect(touched.has(n.id), n.id).toBe(true);
  });

  it('answers an unknown id with no relations', () => {
    expect(nodeRelations('nowhere')).toEqual({ collects: [], sharedWith: [] });
  });
});

describe('layoutGraph', () => {
  it('lays the graph out the same way twice, inside the box, with the hub centred', () => {
    const a = layoutGraph(GRAPH_NODES, GRAPH_EDGES, { width: 800, height: 520 });
    expect(layoutGraph(GRAPH_NODES, GRAPH_EDGES, { width: 800, height: 520 })).toEqual(a);
    expect(a['night-network']).toEqual({ x: 400, y: 260 });
    for (const p of Object.values(a)) expect(p.x >= 0 && p.x <= 800 && p.y >= 0 && p.y <= 520).toBe(true);
  });

  it('places every node, keeps services nearer the hub than the outer ring, and stays inside a tall box', () => {
    const size = { width: 360, height: 560 };
    const a = layoutGraph(GRAPH_NODES, GRAPH_EDGES, size);
    expect(Object.keys(a).sort()).toEqual(GRAPH_NODES.map((n) => n.id).sort());
    const reach = (id: string) => Math.hypot((a[id].x - 180) / 180, (a[id].y - 280) / 280);
    const services = GRAPH_NODES.filter((n) => n.kind === 'service').map((n) => reach(n.id));
    const outer = GRAPH_NODES.filter((n) => n.kind === 'data' || n.kind === 'party').map((n) => reach(n.id));
    expect(Math.max(...services)).toBeLessThan(Math.min(...outer));
    for (const p of Object.values(a)) expect(p.x >= 0 && p.x <= 360 && p.y >= 0 && p.y <= 560).toBe(true);
  });

  it('keeps distinct nodes apart', () => {
    const a = layoutGraph(GRAPH_NODES, GRAPH_EDGES, { width: 800, height: 520 });
    const points = Object.values(a);
    for (let i = 0; i < points.length; i += 1) for (let j = i + 1; j < points.length; j += 1) expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThan(20);
  });
});
