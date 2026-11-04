import type { GraphEdge, GraphNode } from '@/content/legal-graph';

export type GraphPoint = { x: number; y: number };
export type GraphSize = { width: number; height: number };

type Sector = { service: string | null; members: string[]; slots: number };

const INNER = 0.46;
const OUTER = 0.94;
const TOP = -Math.PI / 2;
const TURN = Math.PI * 2;

const SAMPLES = 720;

const round = (value: number): number => Math.round(value * 100) / 100;

function arcTable(size: GraphSize): number[] {
  const rx = size.width / 2;
  const ry = size.height / 2;
  const steps = Array.from({ length: SAMPLES }, (_, index) => {
    const t = TOP + ((index + 0.5) * TURN) / SAMPLES;
    return Math.hypot(rx * Math.sin(t), ry * Math.cos(t));
  });
  return steps.reduce<number[]>((sums, step) => [...sums, sums[sums.length - 1] + step], [0]);
}

function angleAt(table: readonly number[], fraction: number): number {
  const target = (((fraction % 1) + 1) % 1) * table[SAMPLES];
  const index = Math.max(0, table.findIndex((sum) => sum >= target) - 1);
  const span = table[index + 1] - table[index];
  const within = span > 0 ? (target - table[index]) / span : 0;
  return TOP + ((index + within) * TURN) / SAMPLES;
}

function onRing(size: GraphSize, reach: number, angle: number): GraphPoint {
  const cx = size.width / 2;
  const cy = size.height / 2;
  return { x: round(cx + Math.cos(angle) * cx * reach), y: round(cy + Math.sin(angle) * cy * reach) };
}

function neighbours(id: string, edges: readonly GraphEdge[], outer: ReadonlySet<string>): string[] {
  return edges.filter((edge) => edge.from === id && outer.has(edge.to)).map((edge) => edge.to);
}

function chainServices(services: readonly string[], kids: ReadonlyMap<string, string[]>): string[] {
  const shared = (a: string, b: string) => (kids.get(a) ?? []).filter((id) => (kids.get(b) ?? []).includes(id)).length;
  return services.reduce<string[]>((chain, service) => {
    if (chain.includes(service)) return chain;
    const partner = services.find((other) => other !== service && !chain.includes(other) && shared(service, other) > 0);
    return partner ? [...chain, service, partner] : [...chain, service];
  }, []);
}

function sectors(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): Sector[] {
  const outer = new Set(nodes.filter((node) => node.kind === 'data' || node.kind === 'party').map((node) => node.id));
  const services = nodes.filter((node) => node.kind === 'service').map((node) => node.id);
  const kids = new Map(services.map((id) => [id, neighbours(id, edges, outer)]));
  const order = chainServices(services, kids);
  const placed = order.reduce<{ taken: ReadonlySet<string>; list: Sector[] }>(
    (acc, service, index) => {
      const later = new Set(order.slice(index + 1).flatMap((next) => kids.get(next) ?? []));
      const own = (kids.get(service) ?? []).filter((id) => !acc.taken.has(id));
      const members = [...own.filter((id) => !later.has(id)), ...own.filter((id) => later.has(id))];
      return { taken: new Set([...acc.taken, ...members]), list: [...acc.list, { service, members, slots: Math.max(members.length, 1) }] };
    },
    { taken: new Set(), list: [] },
  );
  const rest = [...outer].filter((id) => !placed.taken.has(id));
  return rest.length ? [...placed.list, { service: null, members: rest, slots: rest.length }] : placed.list;
}

export function layoutGraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[], size: GraphSize): Record<string, GraphPoint> {
  const ring = sectors(nodes, edges);
  const total = ring.reduce((sum, sector) => sum + sector.slots, 0);
  const step = total ? 1 / total : 0;
  const start = -((ring[0]?.slots ?? 0) * step) / 2;
  const table = arcTable(size);
  const at = (reach: number, fraction: number) => onRing(size, reach, angleAt(table, fraction));
  const points = ring.flatMap((sector, index) => {
    const from = start + ring.slice(0, index).reduce((sum, before) => sum + before.slots, 0) * step;
    const members = sector.members.map((id, slot) => [id, at(OUTER, from + (slot + 0.5) * step)] as const);
    return sector.service ? [[sector.service, at(INNER, from + (sector.slots * step) / 2)] as const, ...members] : members;
  });
  const hubs = nodes.filter((node) => node.kind === 'hub').map((node) => [node.id, { x: size.width / 2, y: size.height / 2 }] as const);
  return Object.fromEntries([...hubs, ...points]);
}
