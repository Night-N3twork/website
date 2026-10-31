import { describe, expect, it } from 'vitest';
import { requestUrl } from '@/lib/security/request-url';

describe('requestUrl', () => {
  it('reads origin-form targets with their query', () => {
    const url = requestUrl('/en/projects?x=1');
    expect(url?.pathname).toBe('/en/projects');
    expect(url?.search).toBe('?x=1');
  });

  it('keeps a leading double slash as part of the path', () => {
    expect(requestUrl('//evil/x/')?.pathname).toBe('//evil/x/');
    expect(requestUrl('/\\evil/x/')?.pathname).toBe('//evil/x/');
  });

  it('drops the host of an absolute-form target', () => {
    const url = requestUrl('http://other.example/en/x?q=2');
    expect(url?.host).toBe('localhost');
    expect(url?.pathname).toBe('/en/x');
    expect(url?.search).toBe('?q=2');
  });

  it('returns null for targets the URL parser rejects', () => {
    expect(requestUrl('http://[/')).toBeNull();
    expect(requestUrl('http://a:99999/')).toBeNull();
  });
});
