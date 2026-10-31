import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

const nonces = new WeakMap<object, string>();

export function createNonce(): string {
  return randomBytes(16).toString('base64');
}

export function requestNonce(req: IncomingMessage | Request): string {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    const fromHeader = req.headers.get('x-nonce');
    if (fromHeader) return fromHeader;
    const existing = nonces.get(req);
    if (existing) return existing;
    const nonce = createNonce();
    nonces.set(req, nonce);
    return nonce;
  }
  const existing = nonces.get(req);
  if (existing) return existing;
  const nonce = createNonce();
  nonces.set(req, nonce);
  if ('headers' in req && req.headers && typeof req.headers === 'object') {
    (req.headers as Record<string, string | string[] | undefined>)['x-nonce'] = nonce;
  }
  return nonce;
}
