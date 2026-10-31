import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { describe, expect, it } from 'vitest';
import { holdCacheFor } from '@/lib/security/hold-cache';

const VALUE = 'public, max-age=31536000, immutable';
const response = () => new ServerResponse(new IncomingMessage(new Socket()));

describe('holdCacheFor', () => {
  it.each([200, 206, 304])('caches a %i', (status) => {
    const res = response();
    holdCacheFor(res, VALUE);
    res.writeHead(status);
    expect(res.getHeader('cache-control')).toBe(VALUE);
  });

  it.each([404, 412, 416, 500])('leaves a %i uncached', (status) => {
    const res = response();
    holdCacheFor(res, VALUE);
    res.writeHead(status);
    expect(res.getHeader('cache-control')).toBeUndefined();
  });

  it('applies when node writes the head on its own for a streamed body', () => {
    const res = response();
    holdCacheFor(res, VALUE);
    res.statusCode = 200;
    res.write('x');
    expect(res.getHeader('cache-control')).toBe(VALUE);
  });
});
