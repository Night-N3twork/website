import { type ReactNode, useEffect, useRef } from 'react';
import { Links, Meta, Outlet, Scripts, useLocation, useMatches, useRouteLoaderData } from 'react-router';
import { DEFAULT_LOCALE } from '@/i18n/locales';
import { languageLinks } from '@/i18n/languages';
import { splitLocale } from '@/i18n/paths';
import { type Translate, translator } from '@/i18n/translate';
import { analyticsTags } from '@/lib/analytics';
import { env } from '@/lib/env';
import { useRouteMotion } from '@/navigation/useRouteMotion';
import geistWoff2 from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import basePath from '@/styles/glass/base.css?url';
import chromePath from '@/styles/glass/chrome.css?url';
import fontsPath from '@/styles/glass/fonts.css?url';
import pagesPath from '@/styles/glass/pages.css?url';
import tokensPath from '@/styles/glass/tokens.css?url';
import { Cursor } from '@/ui/glass/chrome/Cursor';
import { Footer } from '@/ui/glass/chrome/Footer';
import { Rail } from '@/ui/glass/chrome/Rail';
import { SkipLink } from '@/ui/glass/chrome/SkipLink';
import { Nav } from '@/ui/glass/Nav';
import { RouteError } from '@/ui/glass/Lost';
import { Stage } from '@/ui/glass/Stage';
import { siteChrome } from './chrome';
import { pageLocation } from './locale';
import { useNonce } from './nonce';
import { SiteJsonLd } from './SiteJsonLd';
import type { Route } from './+types/root';
import { routeName } from '@/navigation/route-name';

const MOTION_CLASS = "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')";
const finePointer = (): boolean => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

export const links: Route.LinksFunction = () => [
  { rel: 'preload', href: geistWoff2, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: fontsPath },
  { rel: 'stylesheet', href: tokensPath },
  { rel: 'stylesheet', href: basePath },
  { rel: 'stylesheet', href: pagesPath },
  { rel: 'stylesheet', href: chromePath },
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'icon', href: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { locale } = pageLocation(request);
  const [chrome, lost, broken] = await Promise.all([siteChrome(locale), translator(locale, 'notFound'), translator(locale, 'serverError')]);
  const errorCopy = (t: Translate) => ({ meta: t('meta'), title: t('title'), lede: t('lede'), cta: t('cta') });
  return { locale, chrome, notFound: errorCopy(lost), serverError: errorCopy(broken) };
}

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData<typeof loader>('root');
  const route = routeName(useMatches());
  const { locale, path } = splitLocale(useLocation().pathname);
  const languages = languageLinks(locale, path);
  const nonce = useNonce();
  const analytics = analyticsTags(env.gaId);
  useEffect(() => {
    if (!finePointer()) return;
    void import('@/motion/micro').then(({ mountGlobalMicro }) => mountGlobalMicro());
  }, []);
  return (
    <html lang={data?.locale ?? DEFAULT_LOCALE} data-backdrop={__GLASS_BACKDROP__} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MOTION_CLASS }} />
        {analytics && (
          <>
            <script async src={analytics.loader} nonce={nonce} suppressHydrationWarning />
            <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: analytics.setup }} />
          </>
        )}
        <Meta />
        <Links />
        <SiteJsonLd />
      </head>
      <body data-route={route}>
        {data && <SkipLink label={data.chrome.labels.skip} />}
        <div className="veil" id="veil" aria-hidden="true" />
        <div className="loader" id="loader" aria-hidden="true">
          <span className="loader-track">
            <span className="loader-fill" />
          </span>
          <span className="loader-count" />
        </div>
        <Stage />
        {data && <Nav chrome={data.chrome} path={path} languages={languages} />}
        <RouteMain>{children}</RouteMain>
        {data && <Footer chrome={data.chrome} path={path} languages={languages} />}
        {route === 'home' && <Rail label="Sections" />}
        <Cursor />
        <div className="grain" aria-hidden="true" />
        <div className="route-bar" aria-hidden="true" />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

function RouteMain({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  useRouteMotion(main);
  return (
    <main id="main" tabIndex={-1} ref={main}>
      {children}
    </main>
  );
}

export default function App() {
  return <Outlet />;
}

export const ErrorBoundary = RouteError;
