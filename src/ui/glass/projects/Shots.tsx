import type { ProductGroup, ProductSlug, Stage } from '@/content/projects';
import type { ShotImage } from '@/content/shots';
import { TransitionLink } from '@/navigation/TransitionLink';
import { Chevron, Chip, pad } from '../parts';
import type { FilterValue } from './Filter';
import { ShotPicture, TrackControls, type TrackCopy, useTrack } from './track';

export interface ShotSlide {
  slug: ProductSlug;
  group: ProductGroup;
  n: number;
  name: string;
  line: string;
  stage: Stage;
  image: ShotImage;
}

export interface ShotsCopy extends TrackCopy {
  label: string;
}

interface ShotsProps {
  copy: ShotsCopy;
  slides: ShotSlide[];
  filter: FilterValue;
  stages: Record<Stage, string>;
}

interface BandProps {
  copy: ShotsCopy;
  slides: ShotSlide[];
  stages: Record<Stage, string>;
}

const TRACK_ID = 'shots-track';
const SIZES = '(max-width: 760px) 80vw, min(58vw, 980px)';

function Slide({ slide, stage, eager }: { slide: ShotSlide; stage: string; eager: boolean }) {
  return (
    <li className="shot" data-group={slide.group}>
      <TransitionLink className="shot-link" to={`/projects/${slide.slug}`}>
        <span className="shot-frame cut">
          <ShotPicture image={slide.image} sizes={SIZES} alt="" eager={eager} />
        </span>
        <span className="shot-cap">
          <span className="shot-num">{pad(slide.n)}</span>{' '}
          <span className="shot-name">{slide.name}</span>{' '}
          <Chip stage={slide.stage} label={stage} slug={slide.slug} />{' '}
          <span className="shot-line">{slide.line}</span>
          <Chevron />
        </span>
      </TransitionLink>
    </li>
  );
}

function Band({ copy, slides, stages }: BandProps) {
  const { track, active, go } = useTrack(slides.length);
  return (
    <section className="shots" aria-label={copy.label} data-reveal="">
      <ol className="shots-track" id={TRACK_ID} ref={track} data-lenis-prevent-horizontal="">
        {slides.map((slide, i) => (
          <Slide key={slide.slug} slide={slide} stage={stages[slide.stage]} eager={i === 0} />
        ))}
      </ol>
      {slides.length > 1 ? <TrackControls id={TRACK_ID} copy={copy} active={active} total={slides.length} go={go} /> : null}
    </section>
  );
}

export function Shots({ copy, slides, filter, stages }: ShotsProps) {
  const visible = filter === 'all' ? slides : slides.filter((slide) => slide.group === filter);
  if (!visible.length) return null;
  return <Band key={filter} copy={copy} slides={visible} stages={stages} />;
}
