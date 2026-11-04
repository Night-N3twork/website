export type GraphKind = 'hub' | 'service' | 'data' | 'party';
export type GraphRelation = 'collects' | 'shares';

export type GraphNode = { readonly id: string; readonly kind: GraphKind; readonly clause: string };
export type GraphEdge = { readonly from: string; readonly to: string; readonly relation: GraphRelation };

export type LegalGraphCopy = {
  heading: string;
  listHeading: string;
  collects: string;
  shares: string;
  separator: string;
  labels: Record<string, string>;
};

export type NodeRelations = { collects: GraphNode[]; sharedWith: GraphNode[] };

export const GRAPH_HUB = 'night-network';

export const GRAPH_NODES: readonly GraphNode[] = [
  { id: GRAPH_HUB, kind: 'hub', clause: 'short' },
  { id: 'website', kind: 'service', clause: 'website' },
  { id: 'bots', kind: 'service', clause: 'bots' },
  { id: 'account', kind: 'service', clause: 'account' },
  { id: 'libraries', kind: 'service', clause: 'libraries' },
  { id: 'registry-cdn', kind: 'service', clause: 'libraries' },
  { id: 'wireguard', kind: 'service', clause: 'wireguard' },
  { id: 'captcha', kind: 'service', clause: 'wireguard' },
  { id: 'ip-address', kind: 'data', clause: 'website' },
  { id: 'discord-id', kind: 'data', clause: 'bots' },
  { id: 'email', kind: 'data', clause: 'account' },
  { id: 'links', kind: 'data', clause: 'bots' },
  { id: 'synced-data', kind: 'data', clause: 'account' },
  { id: 'captcha-data', kind: 'data', clause: 'wireguard' },
  { id: 'cloudflare', kind: 'party', clause: 'recipients' },
  { id: 'google', kind: 'party', clause: 'recipients' },
  { id: 'discord', kind: 'party', clause: 'recipients' },
  { id: 'patreon', kind: 'party', clause: 'recipients' },
  { id: 'cash-app', kind: 'party', clause: 'recipients' },
  { id: 'mullvad', kind: 'party', clause: 'recipients' },
  { id: 'two-captcha', kind: 'party', clause: 'recipients' },
];

export const GRAPH_EDGES: readonly GraphEdge[] = [
  { from: 'website', to: 'ip-address', relation: 'collects' },
  { from: 'website', to: 'cloudflare', relation: 'shares' },
  { from: 'website', to: 'google', relation: 'shares' },
  { from: 'bots', to: 'discord-id', relation: 'collects' },
  { from: 'bots', to: 'links', relation: 'collects' },
  { from: 'bots', to: 'discord', relation: 'shares' },
  { from: 'account', to: 'discord-id', relation: 'collects' },
  { from: 'account', to: 'email', relation: 'collects' },
  { from: 'account', to: 'synced-data', relation: 'collects' },
  { from: 'account', to: 'patreon', relation: 'shares' },
  { from: 'registry-cdn', to: 'ip-address', relation: 'collects' },
  { from: 'wireguard', to: 'mullvad', relation: 'shares' },
  { from: 'captcha', to: 'captcha-data', relation: 'collects' },
  { from: 'captcha', to: 'two-captcha', relation: 'shares' },
  { from: GRAPH_HUB, to: 'cash-app', relation: 'shares' },
];

const byId = new Map(GRAPH_NODES.map((node) => [node.id, node]));

function targets(id: string, relation: GraphRelation): GraphNode[] {
  return GRAPH_EDGES.filter((edge) => edge.from === id && edge.relation === relation).flatMap((edge) => byId.get(edge.to) ?? []);
}

export function nodeRelations(id: string): NodeRelations {
  return { collects: targets(id, 'collects'), sharedWith: targets(id, 'shares') };
}
