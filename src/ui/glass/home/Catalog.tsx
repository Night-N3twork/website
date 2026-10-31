import { type KeyboardEvent, useRef, useState } from 'react';
import type { ProductGroup } from '@/content/projects';
import { Row } from '../parts';
import { usePill } from '../pill';
import type { CatalogCopy, StageLabels } from './types';

const MOVES: Record<string, (i: number, n: number) => number> = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
};

export function Catalog({ copy, stages, onSelect }: { copy: CatalogCopy; stages: StageLabels; onSelect?: (panel: HTMLElement | null) => void }) {
  const [selected, setSelected] = useState<ProductGroup>(copy.tabs[0].key);
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  usePill(pill, list, '[aria-selected="true"]', selected);
  const select = (key: ProductGroup, focus: boolean): void => {
    if (key !== selected) {
      setSelected(key);
      requestAnimationFrame(() => onSelect?.(document.querySelector<HTMLElement>(`#panel-${key} > .rows`)));
    }
    if (focus) document.getElementById(`tab-${key}`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const move = MOVES[e.key];
    const index = copy.tabs.findIndex((tab) => tab.key === selected);
    if (!move || index < 0) return;
    e.preventDefault();
    select(copy.tabs[move(index, copy.tabs.length)].key, true);
  };
  return (
    <section className="sec sec-catalog" data-frame="catalog" data-side="right" aria-labelledby="catalog-heading">
      <div className="copy">
        <h2 className="title" id="catalog-heading" data-split="">
          {copy.title}
        </h2>
        <p className="lede" data-reveal="">
          {copy.lede}
        </p>
        <div className="tabs" role="tablist" aria-label={copy.title} data-reveal="" ref={list} onKeyDown={onKeyDown}>
          <span className="tabs-pill" aria-hidden="true" ref={pill} />
          {copy.tabs.map((tab) => (
            <button key={tab.key} type="button" role="tab" id={`tab-${tab.key}`} aria-controls={`panel-${tab.key}`} aria-selected={tab.key === selected} tabIndex={tab.key === selected ? 0 : -1} data-tab={tab.key} onClick={() => select(tab.key, false)}>
              {tab.label}
              <span className="tab-count">{tab.items.length}</span>
            </button>
          ))}
        </div>
        <div className="panel cut" data-reveal="">
          {copy.tabs.map((tab) => (
            <div key={tab.key} role="tabpanel" id={`panel-${tab.key}`} aria-labelledby={`tab-${tab.key}`} hidden={tab.key !== selected}>
              <ul className="rows">
                {tab.items.map((item) => (
                  <Row key={item.slug} item={item} stage={stages[item.stage]} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
