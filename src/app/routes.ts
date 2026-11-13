import { type RouteConfig, route } from '@react-router/dev/routes';

export default [
  route('api/status', 'routes/api.status.ts', { id: 'api-status' }),
  route('api/revalidate', 'routes/api.revalidate.ts', { id: 'api-revalidate' }),
  route('api/users/:id/avatar', 'routes/api.avatar.ts', { id: 'api-avatar' }),
  route('sitemap.xml', 'routes/sitemap.ts', { id: 'sitemap' }),
  route('robots.txt', 'routes/robots.ts', { id: 'robots' }),
  route('manifest.webmanifest', 'routes/manifest.ts', { id: 'manifest' }),
  route(':locale/opengraph-image', 'routes/og.site.ts', { id: 'og-site' }),
  route(':locale/projects/:slug/opengraph-image', 'routes/og.project.ts', { id: 'og-project' }),
  route(':locale?', 'routes/home.tsx', { id: 'home' }),
  route(':locale?/projects', 'routes/projects.tsx', { id: 'projects' }),
  route(':locale?/projects/:slug', 'routes/project.tsx', { id: 'project' }),
  route(':locale?/community', 'routes/community.tsx', { id: 'community' }),
  route(':locale?/contributors', 'routes/contributors.tsx', { id: 'contributors' }),
  route(':locale?/supporters', 'routes/supporters.tsx', { id: 'supporters' }),
  route(':locale?/privacy', 'routes/privacy.tsx', { id: 'privacy' }),
  route(':locale?/terms', 'routes/terms.tsx', { id: 'terms' }),
  route(':locale?/requests', 'routes/requests.tsx', { id: 'requests' }),
  route(':locale?/docs/*', 'routes/docs.tsx', { id: 'docs' }),
  route('*', 'routes/lost.tsx', { id: 'lost' }),
] satisfies RouteConfig;
