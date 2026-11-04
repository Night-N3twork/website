import { type MouseEvent, type RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GRAPH_EDGES, GRAPH_HUB, GRAPH_NODES, type GraphNode, type LegalGraphCopy } from '@/content/legal-graph';
import { GRAPH_FRAMES, type GraphFrame, LINE, type LabelPlacement, NODE_RADIUS, placeLabels } from '@/lib/legal-graph-labels';
import { type GraphPoint, layoutGraph } from '@/lib/legal-graph-layout';

type LinkKind = 'spoke' | 'collects' | 'shares';
type Link = { key: string; from: string; to: string; kind: LinkKind };

const FRAME_PROPERTY = '--graph-frame';
const HIT = 10;

const LINKS: readonly Link[] = [
  ...GRAPH_NODES.filter((node) => node.kind === 'service').map((node) => ({ key: `spoke-${node.id}`, from: GRAPH_HUB, to: node.id, kind: 'spoke' as const })),
  ...GRAPH_EDGES.map((edge) => ({ key: `${edge.relation}-${edge.from}-${edge.to}`, from: edge.from, to: edge.to, kind: edge.relation })),
];

function frameOf(svg: SVGSVGElement | null): GraphFrame {
  const stage = svg?.parentElement;
  return stage && getComputedStyle(stage).getPropertyValue(FRAME_PROPERTY).trim() === 'tall' ? GRAPH_FRAMES.tall : GRAPH_FRAMES.wide;
}

function useFrame(ref: RefObject<SVGSVGElement | null>): GraphFrame {
  const [frame, setFrame] = useState<GraphFrame>(GRAPH_FRAMES.wide);
  useLayoutEffect(() => {
    const update = (): void => setFrame(frameOf(ref.current));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref]);
  return frame;
}

function litNodes(active: string | null): ReadonlySet<string> {
  if (!active) return new Set();
  return new Set([active, ...LINKS.flatMap((link) => (link.from === active ? [link.to] : link.to === active ? [link.from] : []))]);
}

function jump(event: MouseEvent<Element>, clause: string): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (window.location.hash === `#${clause}`) {
    document.getElementById(clause)?.scrollIntoView({ block: 'start' });
    return;
  }
  window.location.hash = clause;
}

interface NodeProps {
  node: GraphNode;
  label: string;
  point: GraphPoint;
  spot: LabelPlacement;
  font: number;
  lit: boolean;
  onHover: (id: string | null) => void;
  onFocus: (id: string | null) => void;
}

function GraphNodeLink({ node, label, point, spot, font, lit, onHover, onFocus }: NodeProps) {
  const radius = NODE_RADIUS[node.kind];
  return (
    <a
      className={`legal-graph-node${lit ? ' is-lit' : ''}`}
      href={`#${node.clause}`}
      aria-label={label}
      data-kind={node.kind}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocus(node.id)}
      onBlur={() => onFocus(null)}
      onClick={(event) => jump(event, node.clause)}
    >
      <circle className="legal-graph-hit" cx={point.x} cy={point.y} r={radius + HIT} />
      <circle className="legal-graph-dot" cx={point.x} cy={point.y} r={radius} />
      <text className="legal-graph-label" textAnchor={spot.anchor} aria-hidden="true">
        {spot.lines.map((line, index) => (
          <tspan key={index} x={spot.x} y={spot.baseline + index * font * LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </a>
  );
}

export function LegalGraph({ copy }: { copy: LegalGraphCopy }) {
  const ref = useRef<SVGSVGElement>(null);
  const frame = useFrame(ref);
  const points = useMemo(() => layoutGraph(GRAPH_NODES, GRAPH_EDGES, frame.size), [frame]);
  const spots = useMemo(() => placeLabels(GRAPH_NODES, points, copy.labels, frame), [points, copy.labels, frame]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const active = hovered ?? focused;
  const lit = useMemo(() => litNodes(active), [active]);
  const box = `${-frame.padX} ${-frame.padY} ${frame.size.width + frame.padX * 2} ${frame.size.height + frame.padY * 2}`;
  return (
    <svg ref={ref} className="legal-graph" viewBox={box} role="group" aria-label={copy.heading} data-frame={frame.name} data-active={active ?? undefined}>
      <g className="legal-graph-links" aria-hidden="true">
        {LINKS.map((link) => (
          <line
            key={link.key}
            className={`legal-graph-edge legal-graph-${link.kind}${active && (link.from === active || link.to === active) ? ' is-lit' : ''}`}
            x1={points[link.from].x}
            y1={points[link.from].y}
            x2={points[link.to].x}
            y2={points[link.to].y}
          />
        ))}
      </g>
      <g className="legal-graph-nodes" fontSize={frame.font}>
        {GRAPH_NODES.map((node) => (
          <GraphNodeLink
            key={node.id}
            node={node}
            label={copy.labels[node.id]}
            point={points[node.id]}
            spot={spots[node.id]}
            font={frame.font}
            lit={lit.has(node.id)}
            onHover={setHovered}
            onFocus={setFocused}
          />
        ))}
      </g>
    </svg>
  );
}
