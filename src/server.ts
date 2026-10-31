import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequestListener } from '@react-router/node';
import type { ServerBuild } from 'react-router';
import sirv from 'sirv';
import { contextWithNonce } from '@/app/nonce';
import { redirectFor } from '@/i18n/route';
import { readCdnBase, serverEnv } from '@/lib/data/env';
import { requestNonce } from '@/lib/security/nonce';
import { requestUrl } from '@/lib/security/request-url';
import { type Handler, siteListener } from '@/lib/security/site-listener';

const ENV_FILES = ['.env.production.local', '.env.local', '.env.production', '.env'];
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
for (const file of ENV_FILES) if (existsSync(file)) process.loadEnvFile(file);
serverEnv();
await import('@/lib/env');

const build = (await import(new URL('./server/index.js', import.meta.url).href)) as ServerBuild;
const app = createRequestListener({
  build,
  mode: 'production',
  getLoadContext: (req) => contextWithNonce(requestNonce(req as unknown as import('node:http').IncomingMessage)),
});
const assets = sirv('build/client', { etag: true, gzip: false, brotli: false });
const handler: Handler = (req, res) => {
  const url = requestUrl(req.url ?? '/');
  if (!url) {
    res.writeHead(400).end();
    return;
  }
  const redirect = redirectFor(url);
  if (redirect) {
    res.writeHead(redirect.status, { location: redirect.to });
    res.end();
    return;
  }
  assets(req, res, () => app(req, res));
};

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const server = createServer(siteListener(handler, { cdnBase: readCdnBase(process.env) }));

server.listen(port, host, () => console.info(`Listening on http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => server.close(() => process.exit(0)));
