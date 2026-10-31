import type { ServerResponse } from 'node:http';

const CACHEABLE = new Set([200, 206, 304]);

export function holdCacheFor(res: ServerResponse, value: string): void {
  const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => ServerResponse;
  res.writeHead = ((status: number, ...rest: unknown[]) => {
    if (CACHEABLE.has(status)) res.setHeader('Cache-Control', value);
    return writeHead(status, ...rest);
  }) as ServerResponse['writeHead'];
}
