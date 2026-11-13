import { SITE } from '@/content/site';
import { LOCALES } from '@/i18n/locales';
import { PALETTE } from '@/lib/art/palette';
import { LEGAL_STAGE } from '@/lib/legal-stage';
import { absoluteUrl, hreflangUrls, localizedUrl, pagePaths } from './paths';

export const ROUTE_CACHE = 'public, max-age=0, must-revalidate';
export const PAGE_PATHS: readonly string[] = pagePaths(LEGAL_STAGE);

const PRIORITY = { home: 1, project: 0.8, page: 0.6, doc: 0.5 } as const;
const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

const xml = (value: string) => value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);

function priority(path: string): number {
  if (path === '/') return PRIORITY.home;
  return path.startsWith('/projects') ? PRIORITY.project : PRIORITY.page;
}

function entry(url: string, path: string): string {
  const links = Object.entries(hreflangUrls(path)).map(([hreflang, href]) => `<xhtml:link rel="alternate" hreflang="${xml(hreflang)}" href="${xml(href)}" />\n`);
  return `<url>\n<loc>${xml(url)}</loc>\n${links.join('')}<changefreq>${path === '/' ? 'weekly' : 'monthly'}</changefreq>\n<priority>${priority(path)}</priority>\n</url>\n`;
}

function docEntry(path: string): string {
  return `<url>\n<loc>${xml(absoluteUrl(path))}</loc>\n<changefreq>monthly</changefreq>\n<priority>${PRIORITY.doc}</priority>\n</url>\n`;
}

export function sitemapXml(paths: readonly string[] = PAGE_PATHS, docs: readonly string[] = []): string {
  const entries = [...paths.flatMap((path) => LOCALES.map((locale) => entry(localizedUrl(locale, path), path))), ...docs.map(docEntry)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('')}</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-Agent: *\nAllow: /\nDisallow: /api/\n\nHost: ${absoluteUrl('/')}\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`;
}

export function webManifest(description: string): string {
  return JSON.stringify({
    name: SITE.name,
    short_name: SITE.name,
    description,
    start_url: '/',
    display: 'standalone',
    background_color: PALETTE.night,
    theme_color: PALETTE.night,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
}
