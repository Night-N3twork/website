import { type ComponentType, lazy, Suspense, useSyncExternalStore } from 'react';
import type { LegalGraphCopy } from '@/content/legal-graph';
import type { LegalHead, LegalPageData, LegalSection } from '@/content/legal-pages';
import { Section } from '../parts';
import { LegalGraphList } from './LegalGraphList';
import { LegalIndex } from './LegalIndex';

type GraphView = ComponentType<{ copy: LegalGraphCopy }>;

const NoGraph: GraphView = () => null;
const LegalGraph = lazy<GraphView>(() =>
  import('./LegalGraph').then(
    (module) => ({ default: module.LegalGraph }),
    () => ({ default: NoGraph }),
  ),
);
const quiet = () => () => {};
const hydratedNow = () => true;
const serverRender = () => false;

function LegalMap({ copy }: { copy: LegalGraphCopy }) {
  const hydrated = useSyncExternalStore(quiet, hydratedNow, serverRender);
  return (
    <section className="legal-map" aria-labelledby="legal-map-heading">
      <h2 className="legal-map-title" id="legal-map-heading">
        {copy.heading}
      </h2>
      <div className="legal-graph-stage">
        {hydrated ? (
          <Suspense fallback={null}>
            <LegalGraph copy={copy} />
          </Suspense>
        ) : null}
      </div>
      <p className="legal-graph-key" aria-hidden="true">
        <span className="legal-graph-key-collects">{copy.collects}</span>
        <span className="legal-graph-key-shares">{copy.shares}</span>
      </p>
      <h3 className="legal-graph-list-title" id="legal-graph-list-heading">
        {copy.listHeading}
      </h3>
      <LegalGraphList copy={copy} labelledBy="legal-graph-list-heading" />
    </section>
  );
}

function LegalHeader({ head }: { head: LegalHead }) {
  return (
    <Section frame="page" side="left" aria-labelledby="page-heading">
      <div className="copy">
        <p className="eyebrow" data-intro="">
          {head.kicker}
        </p>
        <h1 className="page-title" id="page-heading" tabIndex={-1} data-intro="headline">
          {head.title}
        </h1>
        <p className="lede" data-intro="">
          {head.lede}
        </p>
        <div className="legal-meta" data-intro="">
          <p className="legal-updated">{head.updated}</p>
          {head.notice ? <p className="legal-notice">{head.notice}</p> : null}
        </div>
      </div>
    </Section>
  );
}

function LegalClause({ section }: { section: LegalSection }) {
  const heading = `${section.id}-heading`;
  return (
    <section className="legal-clause" id={section.id} aria-labelledby={heading}>
      <h2 className="legal-clause-title" id={heading}>
        {section.title}
      </h2>
      {section.body.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </section>
  );
}

export function LegalPage({ data }: { data: LegalPageData }) {
  const { head, sections, graph } = data;
  return (
    <>
      <LegalHeader head={head} />
      <Section frame="list" look="legal" side="left">
        {graph ? <LegalMap copy={graph} /> : null}
        <div className="legal" lang="en">
          <LegalIndex label={head.contents} sections={sections} />
          <div className="legal-text">
            {sections.map((section) => (
              <LegalClause key={section.id} section={section} />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
