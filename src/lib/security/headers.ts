type Header = { key: string; value: string };
type Options = { cdnBase: string; dev: boolean; nonce: string };

const ONE_YEAR_SECONDS = 31_536_000;
const TAG_MANAGER = 'https://www.googletagmanager.com';
const ANALYTICS = ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.g.doubleclick.net', 'https://www.google.com'];

function contentPolicy({ cdnBase, dev, nonce }: Options): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, TAG_MANAGER, ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', new URL(cdnBase).origin, TAG_MANAGER, ...ANALYTICS],
    'font-src': ["'self'"],
    'connect-src': ["'self'", TAG_MANAGER, ...ANALYTICS],
    'worker-src': ["'self'", 'blob:'],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ');
}

export function securityHeaders(options: Options): Header[] {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'X-Frame-Options', value: 'DENY' },
    ...(options.dev ? [] : [{ key: 'Strict-Transport-Security', value: `max-age=${ONE_YEAR_SECONDS}` }]),
    { key: 'Content-Security-Policy', value: contentPolicy(options) },
  ];
}
