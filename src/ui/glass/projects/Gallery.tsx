import type { ShotImage } from '@/content/shots';
import { ShotPicture, TrackControls, type TrackCopy, useTrack } from './track';

export interface GalleryCopy extends TrackCopy {
  label: string;
  alts: string[];
}

interface GalleryProps {
  copy: GalleryCopy;
  images: ShotImage[];
}

const TRACK_ID = 'gallery-track';
const SIZES = '(max-width: 760px) 86vw, min(64vw, 1040px)';

function Track({ copy, images }: GalleryProps) {
  const { track, active, go } = useTrack(images.length);
  return (
    <section className="gallery" aria-labelledby="gallery-heading" data-reveal="">
      <h2 className="eyebrow gallery-title" id="gallery-heading">
        {copy.label}
      </h2>
      <ol className="shots-track gallery-track" id={TRACK_ID} ref={track} tabIndex={images.length > 1 ? 0 : undefined} aria-labelledby="gallery-heading" data-lenis-prevent-horizontal="">
        {images.map((image, i) => (
          <li className="gallery-shot" key={image.src}>
            <span className="shot-frame cut">
              <ShotPicture image={image} sizes={SIZES} alt={copy.alts[i] ?? ''} eager={i === 0} />
            </span>
          </li>
        ))}
      </ol>
      {images.length > 1 ? <TrackControls id={TRACK_ID} copy={copy} active={active} total={images.length} go={go} /> : null}
    </section>
  );
}

export function Gallery({ copy, images }: GalleryProps) {
  return images.length ? <Track copy={copy} images={images} /> : null;
}
