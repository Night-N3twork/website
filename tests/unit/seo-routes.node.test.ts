import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { LOCALES } from '@/i18n/locales';
import { pagePaths } from '@/lib/seo/paths';
import { PAGE_PATHS, sitemapXml } from '@/lib/seo/routes';
import { loader as manifestLoader } from '@/app/routes/manifest';
import { loader as robotsLoader } from '@/app/routes/robots';
import { loader as sitemapLoader } from '@/app/routes/sitemap';

const manifestRoute = () => manifestLoader();
const robotsRoute = () => robotsLoader();
const sitemapRoute = () => sitemapLoader();

const REVALIDATE = 'public, max-age=0, must-revalidate';
const HOME_ENTRY = `<url>
<loc>https://night-x.com</loc>
<xhtml:link rel="alternate" hreflang="en" href="https://night-x.com" />
<xhtml:link rel="alternate" hreflang="es" href="https://night-x.com/es" />
<xhtml:link rel="alternate" hreflang="fr" href="https://night-x.com/fr" />
<xhtml:link rel="alternate" hreflang="ja" href="https://night-x.com/ja" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://night-x.com" />
<changefreq>weekly</changefreq>
<priority>1</priority>
</url>`;

describe('sitemap.xml', () => {
  it('lists every page in every locale with its hreflang set, as Next wrote it', async () => {
    const response = await sitemapRoute();
    expect(response.headers.get('content-type')).toBe('application/xml');
    expect(response.headers.get('cache-control')).toBe(REVALIDATE);
    const body = await response.text();
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n<url>')).toBe(true);
    expect(body.endsWith('</url>\n</urlset>\n')).toBe(true);
    expect(body.match(/<url>/g)).toHaveLength(PAGE_PATHS.length * LOCALES.length);
    expect(body).toContain(HOME_ENTRY);
    expect(body).toMatch(/<loc>https:\/\/night-x\.com\/es\/projects\/umbra<\/loc>\n(?:<xhtml:link [^\n]+\n){5}<changefreq>monthly<\/changefreq>\n<priority>0\.8<\/priority>/);
    expect(body).toMatch(/<loc>https:\/\/night-x\.com\/ja\/community<\/loc>\n(?:<xhtml:link [^\n]+\n){5}<changefreq>monthly<\/changefreq>\n<priority>0\.6<\/priority>/);
  });
});

describe('legal pages in the sitemap', () => {
  const LEGAL = ['/privacy', '/terms', '/requests'];

  it('lists the legal pages only once they go live', () => {
    expect(pagePaths('live')).toEqual(expect.arrayContaining(LEGAL));
    for (const stage of ['preview', 'held'] as const) for (const path of LEGAL) expect(pagePaths(stage)).not.toContain(path);
    expect(pagePaths('held')).toEqual(pagePaths('preview'));
  });

  it('gives each live legal page its hreflang set', () => {
    const body = sitemapXml(pagePaths('live'));
    expect(body.match(/<url>/g)).toHaveLength(pagePaths('live').length * LOCALES.length);
    for (const path of LEGAL) {
      expect(body).toContain(
        `<url>\n<loc>https://night-x.com/fr${path}</loc>\n<xhtml:link rel="alternate" hreflang="en" href="https://night-x.com${path}" />\n<xhtml:link rel="alternate" hreflang="es" href="https://night-x.com/es${path}" />\n<xhtml:link rel="alternate" hreflang="fr" href="https://night-x.com/fr${path}" />\n<xhtml:link rel="alternate" hreflang="ja" href="https://night-x.com/ja${path}" />\n<xhtml:link rel="alternate" hreflang="x-default" href="https://night-x.com${path}" />\n<changefreq>monthly</changefreq>\n<priority>0.6</priority>\n</url>`,
      );
    }
  });
});

describe('robots.txt', () => {
  it('lets crawlers in, keeps them off the api and points them at the sitemap', async () => {
    const response = await robotsRoute();
    expect(response.headers.get('content-type')).toBe('text/plain');
    expect(response.headers.get('cache-control')).toBe(REVALIDATE);
    expect(await response.text()).toBe('User-Agent: *\nAllow: /\nDisallow: /api/\n\nHost: https://night-x.com\nSitemap: https://night-x.com/sitemap.xml\n');
  });
});

describe('manifest.webmanifest', () => {
  it('names the site with its English description and both icons', async () => {
    const response = await manifestRoute();
    expect(response.headers.get('content-type')).toBe('application/manifest+json');
    expect(response.headers.get('cache-control')).toBe(REVALIDATE);
    expect(await response.text()).toBe(
      JSON.stringify({
        name: 'Night Network',
        short_name: 'Night Network',
        description: en.site.description,
        start_url: '/',
        display: 'standalone',
        background_color: '#05060B',
        theme_color: '#05060B',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      }),
    );
  });
});
