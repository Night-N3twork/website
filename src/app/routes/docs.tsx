import docsPath from '@/styles/glass/docs.css?url';
import { preload } from '@/ui/glass/docs/content';
import { DocsPage } from '@/ui/glass/docs/DocsPage';
import { RouteError } from '@/ui/glass/Lost';
import { docsPage } from '../docs.server';
import { headMeta, lostMeta, rootLost } from '../head';
import { localeOf } from '../locale';
import type { Route } from './+types/docs';

export const links: Route.LinksFunction = () => [{ rel: 'stylesheet', href: docsPath }];

export async function loader({ params }: Route.LoaderArgs) {
  return docsPage(localeOf(params.locale), params['*']);
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();
  await preload(data.file);
  return data;
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function DocsRoute({ loaderData }: Route.ComponentProps) {
  return <DocsPage data={loaderData} />;
}

export const ErrorBoundary = RouteError;
