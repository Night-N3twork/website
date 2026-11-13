import type { SidebarEntry } from '@/lib/docs/sidebar';

const library = (label: string, directory: string): SidebarEntry => ({ label, collapsed: true, items: [{ autogenerate: { directory, collapsed: true } }] });

export const DOCS_SIDEBAR: readonly SidebarEntry[] = [
  { label: 'Overview', items: [{ autogenerate: { directory: 'overview' } }] },
  {
    label: 'Libraries',
    items: [library('Dusk', 'dusk'), library('MoonBeam', 'moonbeam'), library('Nova', 'nova'), library('LunaSSH', 'lunassh'), library('MoonScale', 'moonscale')],
  },
  {
    label: 'Services',
    items: [library('Daydream', 'services/daydream'), library('Nebula', 'services/nebula'), library('Space', 'services/space')],
  },
  { label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
  {
    label: 'Reference',
    items: [
      { slug: 'reference', label: 'Overview' },
      { slug: 'reference/dusk-api' },
      { slug: 'reference/dpm-commands' },
      { slug: 'reference/dpm-configuration' },
      { slug: 'reference/lunassh-api' },
      { slug: 'reference/moonbeam-api' },
      { slug: 'reference/moonscale-api' },
      { slug: 'reference/nova-api' },
      { slug: 'reference/limitations' },
    ],
  },
];
