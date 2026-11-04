import { describe, expect, it } from 'vitest';
import { securityHeaders } from '@/lib/security/headers';

const NONCE = 'test-nonce';

const headerMap = (dev = false, nonce = NONCE) => Object.fromEntries(securityHeaders({ dev, nonce }).map(({ key, value }) => [key, value]));
const directives = (policy: string) =>
  Object.fromEntries(policy.split(';').map((part) => part.trim().split(/\s+/)).map(([name, ...sources]) => [name, sources]));

describe('securityHeaders', () => {
  it('sends the standard hardening headers without pinning subdomains to https', () => {
    expect(headerMap()).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=31536000',
    });
  });

  it('the policy is enforced, not report-only', () => {
    const headers = headerMap();
    expect(headers['Content-Security-Policy']).toBeDefined();
    expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined();
  });

  it('script-src has the nonce and no unsafe-inline', () => {
    const policy = directives(headerMap()['Content-Security-Policy']);
    expect(policy['script-src']).toEqual(["'self'", `'nonce-${NONCE}'`, 'https://www.googletagmanager.com']);
    expect(policy['script-src']).not.toContain("'unsafe-inline'");
  });

  it('allows analytics and the inline boot scripts and nothing that frames or plugs in', () => {
    const policy = directives(headerMap()['Content-Security-Policy']);
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['connect-src']).toEqual(expect.arrayContaining(['https://*.google-analytics.com', 'https://*.g.doubleclick.net', 'https://www.google.com']));
    expect(policy['frame-ancestors']).toEqual(["'none'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['form-action']).toEqual(["'self'"]);
  });

  it('loads images only from this site, inline data and the analytics hosts, never from Discord', () => {
    const policy = directives(headerMap()['Content-Security-Policy']);
    expect(policy['img-src']).toEqual([
      "'self'",
      'data:',
      'blob:',
      'https://www.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.g.doubleclick.net',
      'https://www.google.com',
    ]);
    expect(headerMap()['Content-Security-Policy']).not.toContain('discordapp');
  });

  it('lets the dev server evaluate code and keeps production from doing so', () => {
    expect(directives(headerMap(true)['Content-Security-Policy'])['script-src']).toContain("'unsafe-eval'");
    expect(directives(headerMap(false)['Content-Security-Policy'])['script-src']).not.toContain("'unsafe-eval'");
  });

  it('never pins localhost to https from the dev server', () => {
    expect(headerMap(true)['Strict-Transport-Security']).toBeUndefined();
  });
});
