import type { Stage } from '@/content/projects';
import type { ShotImage } from '@/content/shots';
import type { StatusMonitor } from '@/lib/data/status-poll';
import { TransitionLink } from '@/navigation/TransitionLink';
import { Button, Chevron, Chip, Glare, pad, Row, type RowItem, Section } from '../parts';
import { Gallery, type GalleryCopy } from './Gallery';
import { type StatusCopy, StatusPanel } from './StatusPanel';

export interface DetailAction {
  href: string;
  label: string;
}

export interface DetailCopy {
  slug: string;
  name: string;
  line: string;
  back: string;
  group: string;
  partner: string | null;
  stage: Stage;
  stageLabel: string;
  actions: DetailAction[];
  featuresTitle: string;
  features: string[];
  status: StatusCopy;
  relatedTitle: string;
  related: RowItem[];
  stages: Record<Stage, string>;
}

interface ProjectDetailProps {
  copy: DetailCopy;
  locale: string;
  monitorId: number | null;
  monitor: StatusMonitor | null;
  gallery: { copy: GalleryCopy; images: ShotImage[] };
}

function Sep() {
  return (
    <span className="meta-sep" aria-hidden="true">
      /
    </span>
  );
}

function Intro({ copy }: { copy: DetailCopy }) {
  return (
    <Section frame="detail" side="left" aria-labelledby="page-heading">
      <div className="copy detail-copy">
        <TransitionLink className="back" to="/projects" data-intro="">
          <Chevron />
          <span>{copy.back}</span>
        </TransitionLink>
        <p className="detail-meta" data-intro="">
          <Chip stage={copy.stage} label={copy.stageLabel} slug={copy.slug} />
          <Sep />
          <span>{copy.group}</span>
          {copy.partner ? <Sep /> : null}
          {copy.partner ? <span className="detail-partner">{copy.partner}</span> : null}
        </p>
        <h1 className="detail-name" id="page-heading" tabIndex={-1} data-intro="headline" data-intro-split="chars">
          {copy.name}
        </h1>
        <p className="lede" data-intro="">
          {copy.line}
        </p>
        {copy.actions.length ? (
          <div className="actions" data-intro="">
            {copy.actions.map((action, i) => (
              <Button key={action.href} kind={i ? 'ghost' : 'primary'} to={action.href}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function Features({ title, features }: { title: string; features: string[] }) {
  return (
    <div className="detail-what">
      <h2 className="eyebrow" data-reveal="">
        {title}
      </h2>
      <div className="term tilt">
        <div className="tilt-card cut" data-reveal="">
          <ol className="term-lines">
            {features.map((feature, i) => (
              <li key={feature}>
                <span className="term-index">{pad(i + 1)}</span>
                <span className="term-text" data-stream="">
                  {feature}
                </span>
              </li>
            ))}
          </ol>
          <span className="caret" aria-hidden="true" />
          <Glare />
        </div>
      </div>
    </div>
  );
}

function Related({ title, items, stages }: { title: string; items: RowItem[]; stages: Record<Stage, string> }) {
  return (
    <Section frame="related" side="left" aria-labelledby="related-heading">
      <div className="copy">
        <h2 className="title" id="related-heading" data-split="">
          {title}
        </h2>
        <div className="panel cut" data-reveal="">
          <ul className="rows">
            {items.map((item) => (
              <Row key={item.slug} item={item} stage={stages[item.stage]} />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function ProjectDetail({ copy, locale, monitorId, monitor, gallery }: ProjectDetailProps) {
  const hasFeatures = copy.features.length > 0;
  return (
    <>
      <Intro copy={copy} />
      <Gallery copy={gallery.copy} images={gallery.images} />
      <Section frame="list" side="left">
        <div className={hasFeatures ? 'detail-body' : 'detail-body is-solo'}>
          {hasFeatures ? <Features title={copy.featuresTitle} features={copy.features} /> : null}
          <StatusPanel key={copy.slug} copy={copy.status} locale={locale} monitorId={monitorId} initial={monitor} />
        </div>
      </Section>
      {copy.related.length ? <Related title={copy.relatedTitle} items={copy.related} stages={copy.stages} /> : null}
    </>
  );
}
