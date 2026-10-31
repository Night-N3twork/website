import type { Stage } from '@/content/projects';

export interface MarqueeItem {
  slug: string;
  name: string;
  stage: Stage;
}

function Items({ items, copy }: { items: MarqueeItem[]; copy: number }) {
  return items.map((item) => (
    <span key={`${copy}-${item.slug}`} className="mq-item">
      {item.name}
      <span className="mq-dot" data-stage={item.stage} />
    </span>
  ));
}

export function Marquee({ items }: { items: MarqueeItem[] }) {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <Items items={items} copy={0} />
        <Items items={items} copy={1} />
      </div>
    </div>
  );
}
