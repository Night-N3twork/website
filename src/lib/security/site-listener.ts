import compression from 'compression';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { securityHeaders } from './headers';
import { holdCacheFor } from './hold-cache';
import { requestNonce } from './nonce';
import { assetCache } from './site-headers';

export type Handler = (req: IncomingMessage, res: ServerResponse) => void;
type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

export function siteListener(handler: Handler): Handler {
  const compress = compression() as unknown as Middleware;
  return (req, res) => {
    const nonce = requestNonce(req);
    const headers = securityHeaders({ dev: false, nonce });
    for (const { key, value } of headers) res.setHeader(key, value);
    const cache = assetCache((req.url ?? '/').split('?')[0]);
    if (cache) holdCacheFor(res, cache);
    compress(req, res, () => handler(req, res));
  };
}
