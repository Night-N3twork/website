import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { describe, expect, it } from 'vitest';
import { createNonce, requestNonce } from '@/lib/security/nonce';

function mockRequest(): IncomingMessage {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.headers = {};
  return req;
}

describe('security nonce', () => {
  it('creates random base64 nonces of 16 bytes', () => {
    const nonce = createNonce();
    expect(typeof nonce).toBe('string');
    expect(Buffer.from(nonce, 'base64').byteLength).toBe(16);
  });

  it('nonces are unique and per request', () => {
    const req1 = mockRequest();
    const req2 = mockRequest();
    const nonce1 = requestNonce(req1);
    const nonce1Again = requestNonce(req1);
    const nonce2 = requestNonce(req2);
    expect(nonce1).toBe(nonce1Again);
    expect(nonce2).not.toBe(nonce1);
    expect(typeof nonce1).toBe('string');
    expect(nonce1.length).toBeGreaterThan(0);
  });
});
