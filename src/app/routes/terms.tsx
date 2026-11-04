import legalPath from '@/styles/glass/legal.css?url';
import { LegalPage } from '@/ui/glass/legal/LegalPage';
import { RouteError } from '@/ui/glass/Lost';
import { headMeta, lostMeta, rootLost } from '../head';
import { legalPage } from '../legal';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/terms';

export const links: Route.LinksFunction = () => [{ rel: 'stylesheet', href: legalPath }];

export async function loader({ params, request }: Route.LoaderArgs) {
  return legalPage('terms', localeOf(params.locale), pagePath(request));
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function TermsRoute({ loaderData }: Route.ComponentProps) {
  return <LegalPage data={loaderData} />;
}

export const ErrorBoundary = RouteError;
