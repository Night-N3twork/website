import manifest from './shots.json';
import { PRODUCT_GROUPS, type ProductSlug, type Project, projectsIn } from './projects';

export type ShotFormat = 'avif' | 'webp';

export type ShotFile = Record<ShotFormat, string>;

export interface ShotEntry {
  readonly width: number;
  readonly height: number;
  readonly files: Readonly<Record<string, ShotFile | undefined>>;
}

export type ShotManifest = Readonly<Record<string, readonly ShotEntry[]>>;

export interface ShotImage {
  width: number;
  height: number;
  avif: string;
  webp: string;
  src: string;
}

export const SHOTS: ShotManifest = manifest;

type Sized = readonly [number, ShotFile];

const filesOf = (entry: ShotEntry): Sized[] =>
  Object.entries(entry.files)
    .flatMap(([width, file]): Sized[] => (file ? [[Number(width), file]] : []))
    .sort(([a], [b]) => a - b);

export function srcset(entry: ShotEntry, format: ShotFormat): string {
  return filesOf(entry).map(([width, file]) => `${file[format]} ${width}w`).join(', ');
}

function imageOf(entry: ShotEntry): ShotImage {
  const [[, smallest]] = filesOf(entry);
  return { width: entry.width, height: entry.height, avif: srcset(entry, 'avif'), webp: srcset(entry, 'webp'), src: smallest.webp };
}

export function shotsOf(slug: ProductSlug, source: ShotManifest = SHOTS): ShotImage[] {
  return Object.hasOwn(source, slug) ? source[slug].map(imageOf) : [];
}

export function shotOf(slug: ProductSlug, source: ShotManifest = SHOTS): ShotImage | null {
  return shotsOf(slug, source)[0] ?? null;
}

export interface Showcased {
  project: Project;
  n: number;
  image: ShotImage;
}

export function showcase(source: ShotManifest = SHOTS): Showcased[] {
  return PRODUCT_GROUPS.flatMap(projectsIn).flatMap((project, i) => {
    const image = shotOf(project.slug, source);
    return image ? [{ project, n: i + 1, image }] : [];
  });
}
