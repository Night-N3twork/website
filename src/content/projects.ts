export const PRODUCT_GROUPS = ['platform', 'apps', 'browsers'] as const;

export type ProductGroup = (typeof PRODUCT_GROUPS)[number];

export type Stage = 'live' | 'beta' | 'building' | 'planned';

export type ProductSlug =
  | 'dusk'
  | 'moonbeam'
  | 'eclipse'
  | 'luna'
  | 'moonscale'
  | 'nova'
  | 'dpm'
  | 'umbra'
  | 'aurora'
  | 'nyxai'
  | 'solar'
  | 'link-archive'
  | 'ddx'
  | 'daylight'
  | 'space'
  | 'lunar';

export type Project = {
  readonly slug: ProductSlug;
  readonly name: string;
  readonly group: ProductGroup;
  readonly stage: Stage;
  readonly partner: boolean;
  readonly monitorId: number | null;
  readonly url: string | null;
  readonly repo: string | null;
  readonly npm: string | null;
  readonly discordInvite: string | null;
  readonly related: readonly ProductSlug[];
};

export type Release = {
  readonly version: string;
  readonly date: string;
};

const NPM = 'https://www.npmjs.com/package/@nightnetwork/';
const GITHUB = 'https://github.com/Night-N3twork/';
const GITLAB = 'https://gitlab.com/nightnetwork/';
const SOLAR_INVITE = 'https://discord.com/oauth2/authorize?client_id=1340857806177177760';

const NO_LINKS = { monitorId: null, url: null, repo: null, npm: null, discordInvite: null } as const;

export const PROJECTS: readonly Project[] = [
  { slug: 'dusk', name: 'Dusk', group: 'platform', stage: 'live', partner: false, ...NO_LINKS, repo: `${GITHUB}Dusk`, npm: `${NPM}dusk`, related: ['dpm', 'nova', 'moonbeam'] },
  { slug: 'moonbeam', name: 'MoonBeam', group: 'platform', stage: 'live', partner: false, ...NO_LINKS, repo: `${GITHUB}MoonBeam`, npm: `${NPM}moonbeam`, related: ['eclipse', 'nova', 'moonscale'] },
  { slug: 'eclipse', name: 'Eclipse', group: 'platform', stage: 'building', partner: false, ...NO_LINKS, related: ['moonbeam', 'dusk'] },
  { slug: 'luna', name: 'Luna', group: 'platform', stage: 'building', partner: false, ...NO_LINKS, related: ['dusk', 'eclipse'] },
  { slug: 'moonscale', name: 'Moonscale', group: 'platform', stage: 'live', partner: false, ...NO_LINKS, repo: `${GITHUB}Moonscale`, npm: `${NPM}moonscale`, related: ['moonbeam', 'nova'] },
  { slug: 'nova', name: 'Nova', group: 'platform', stage: 'live', partner: false, ...NO_LINKS, repo: `${GITHUB}Nova`, npm: `${NPM}nova`, related: ['dusk', 'moonbeam'] },
  { slug: 'dpm', name: 'dpm', group: 'platform', stage: 'live', partner: false, ...NO_LINKS, repo: `${GITHUB}dpm`, npm: `${NPM}dpm`, related: ['dusk', 'nova'] },
  { slug: 'umbra', name: 'Umbra', group: 'apps', stage: 'beta', partner: false, ...NO_LINKS, related: ['aurora', 'nyxai'] },
  { slug: 'aurora', name: 'Aurora', group: 'apps', stage: 'planned', partner: false, ...NO_LINKS, related: ['umbra'] },
  { slug: 'nyxai', name: 'NyxAI', group: 'apps', stage: 'beta', partner: false, ...NO_LINKS, related: ['umbra', 'link-archive'] },
  { slug: 'solar', name: 'Solar', group: 'apps', stage: 'live', partner: false, ...NO_LINKS, discordInvite: SOLAR_INVITE, related: ['link-archive'] },
  { slug: 'link-archive', name: 'Link Archive', group: 'apps', stage: 'live', partner: false, ...NO_LINKS, monitorId: 16, url: 'https://ampscat.dev', related: ['solar', 'nyxai'] },
  { slug: 'ddx', name: 'DayDreamX', group: 'browsers', stage: 'live', partner: false, ...NO_LINKS, monitorId: 2, url: 'https://daydreamx.pro', repo: `${GITLAB}daydreamx`, related: ['daylight', 'space'] },
  { slug: 'daylight', name: 'Daylight', group: 'browsers', stage: 'building', partner: false, ...NO_LINKS, related: ['ddx', 'lunar'] },
  { slug: 'space', name: 'Space', group: 'browsers', stage: 'live', partner: false, ...NO_LINKS, monitorId: 1, url: 'https://gointospace.app', repo: `${GITLAB}space`, related: ['ddx', 'lunar'] },
  { slug: 'lunar', name: 'Lunar', group: 'browsers', stage: 'live', partner: true, ...NO_LINKS, monitorId: 5, url: 'https://lunaron.top', repo: 'https://github.com/Lunar-Proxy/lunar-v2', related: ['space', 'daylight'] },
];

export const RELEASES: Readonly<Partial<Record<ProductSlug, Release>>> = {
  dusk: { version: '1.0.1', date: '2026-09-27' },
  moonbeam: { version: '1.1.1', date: '2026-09-22' },
  moonscale: { version: '1.0.0', date: '2026-09-27' },
  nova: { version: '1.1.1', date: '2026-11-01' },
  dpm: { version: '1.0.0', date: '2026-09-27' },
};

export function releaseOf(slug: string): Release | undefined {
  return RELEASES[slug as ProductSlug];
}

export const MONITORED: readonly Project[] = PROJECTS.filter((project) => project.monitorId !== null);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function projectsIn(group: ProductGroup): Project[] {
  return PROJECTS.filter((project) => project.group === group);
}
