import type { ProductGroup, ProductSlug, Stage } from '@/content/projects';
import { TransitionLink } from '@/navigation/TransitionLink';
import { Chevron, Chip, pad, Section } from '../parts';

export interface IndexItem {
  slug: ProductSlug;
  name: string;
  line: string;
  stage: Stage;
}

export interface IndexGroup {
  key: ProductGroup;
  title: string;
  line: string;
  items: IndexItem[];
}

interface ProjectIndexProps {
  label: string;
  filter: 'all' | ProductGroup;
  groups: IndexGroup[];
  stages: Record<Stage, string>;
}

function Row({ item, n, stages }: { item: IndexItem; n: number; stages: Record<Stage, string> }) {
  return (
    <li>
      <TransitionLink className="index-row" to={`/projects/${item.slug}`}>
        <span className="index-num">{pad(n)}</span>
        <span className="index-name">{item.name}</span>
        <span className="index-line">{item.line}</span>
        <Chip stage={item.stage} label={stages[item.stage]} />
        <Chevron />
      </TransitionLink>
    </li>
  );
}

export function ProjectIndex({ label, filter, groups, stages }: ProjectIndexProps) {
  const offsets = groups.map((_, i) => groups.slice(0, i).reduce((n, g) => n + g.items.length, 0));
  return (
    <Section frame="list" side="left" aria-label={label}>
      <div className="index">
        {groups.map((group, i) => (
          <div className="index-group" data-group={group.key} key={group.key} hidden={filter !== 'all' && filter !== group.key}>
            <header className="index-head" data-reveal="">
              <h2 className="index-title">{group.title}</h2>
              <span className="index-count">{pad(group.items.length)}</span>
              <p className="index-blurb">{group.line}</p>
            </header>
            <div className="index-panel cut" data-reveal="">
              <ol className="index-rows">
                {group.items.map((item, j) => (
                  <Row key={item.slug} item={item} n={offsets[i] + j + 1} stages={stages} />
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
