import { GRAPH_NODES, type GraphNode, type LegalGraphCopy, nodeRelations } from '@/content/legal-graph';

export interface LegalGraphListProps {
  copy: LegalGraphCopy;
  labelledBy?: string;
}

function Relation({ word, nodes, copy }: { word: string; nodes: readonly GraphNode[]; copy: LegalGraphCopy }) {
  if (!nodes.length) return null;
  return (
    <div>
      <dt>{word}</dt>
      <dd>{nodes.map((node) => copy.labels[node.id]).join(copy.separator)}</dd>
    </div>
  );
}

function ListItem({ node, copy }: { node: GraphNode; copy: LegalGraphCopy }) {
  const { collects, sharedWith } = nodeRelations(node.id);
  return (
    <li data-kind={node.kind}>
      <a className="legal-graph-item" href={`#${node.clause}`}>
        {copy.labels[node.id]}
      </a>
      {collects.length || sharedWith.length ? (
        <dl className="legal-graph-line">
          <Relation word={copy.collects} nodes={collects} copy={copy} />
          <Relation word={copy.shares} nodes={sharedWith} copy={copy} />
        </dl>
      ) : null}
    </li>
  );
}

export function LegalGraphList({ copy, labelledBy }: LegalGraphListProps) {
  return (
    <ul className="legal-graph-list" aria-labelledby={labelledBy}>
      {GRAPH_NODES.filter((node) => node.kind !== 'data').map((node) => (
        <ListItem key={node.id} node={node} copy={copy} />
      ))}
    </ul>
  );
}
