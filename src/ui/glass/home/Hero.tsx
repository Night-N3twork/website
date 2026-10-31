import { Button, Reel, Section } from '../parts';

export interface HeroCopy {
  subline: string;
  headline: string;
  cta: string;
  community: string;
  countShort: string;
  countUnit: string;
  statLine: string;
}

export function Hero({ copy }: { copy: HeroCopy }) {
  const words = copy.headline.split(' ');
  const cut = Math.ceil(words.length / 2);
  return (
    <Section frame="hero" side="left" id="top" aria-labelledby="page-heading">
      <div className="copy">
        <p className="pill cut" data-intro="pill">
          <span className="shimmer">{copy.subline}</span>
        </p>
        <h1 className="headline" id="page-heading" tabIndex={-1} data-intro="headline">
          <span className="headline-line">{words.slice(0, cut).join(' ')}</span>{' '}
          <span className="headline-line dim">{words.slice(cut).join(' ')}</span>
        </h1>
        <div className="actions" data-intro="actions">
          <Button kind="primary" to="/projects">{copy.cta}</Button>
          <Button kind="ghost" to="/community">{copy.community}</Button>
        </div>
      </div>
      <div className="stat" data-intro="stat">
        <span className="stat-rule" aria-hidden="true" />
        <Reel text={copy.countShort} className="stat-num" />
        <span className="stat-unit">{copy.countUnit}</span>
        <span className="stat-line">{copy.statLine}</span>
      </div>
      <span className="cue" aria-hidden="true" data-intro="cue">
        <span className="cue-dot" />
      </span>
    </Section>
  );
}
