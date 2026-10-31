import type { CSSProperties } from 'react';
import { Chip, Eyebrow, Glare, pad, Reel } from '../parts';
import type { ProductsCopy, StageLabels } from './types';

export function Products({ copy, stages }: { copy: ProductsCopy; stages: StageLabels }) {
  const total = copy.items.length;
  return (
    <section className="sec sec-products" data-frame="products" data-side="right" id="projects" aria-labelledby="products-heading" style={{ '--steps': total } as CSSProperties}>
      <div className="pin">
        <div className="copy">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="title" id="products-heading" data-split="">
            {copy.title}
          </h2>
          <p className="lede" data-reveal="">
            {copy.lede}
          </p>
          <div className="deck">
            <ol className="deck-index" data-reveal="children">
              <li className="deck-marker" aria-hidden="true" />
              {copy.items.map((item, i) => (
                <li key={item.slug}>
                  <button type="button" data-index={i} aria-current={i === 0 ? 'step' : undefined}>
                    {item.name}
                  </button>
                </li>
              ))}
            </ol>
            <div className="deck-card tilt">
              <article className="tilt-card cut" data-reveal="">
                <div className="deck-head">
                  <span className="deck-count">
                    <Reel text="01" className="deck-reel" />
                    <span className="deck-total">/ {pad(total)}</span>
                  </span>
                </div>
                <div className="deck-slides" aria-live="polite">
                  {copy.items.map((item, i) => (
                    <div key={item.slug} className="deck-slide" data-index={i} hidden={i > 0}>
                      <h3 className="deck-name">{item.name}</h3>
                      <p className="deck-line">{item.line}</p>
                      <Chip stage={item.stage} label={stages[item.stage]} />
                    </div>
                  ))}
                </div>
                <div className="deck-bar" aria-hidden="true">
                  <span />
                </div>
                <Glare />
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
