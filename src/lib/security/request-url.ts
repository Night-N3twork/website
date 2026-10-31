const BASE = 'http://localhost';

export function requestUrl(target: string): URL | null {
  if (target.startsWith('/')) return URL.parse(`${BASE}${target}`);
  const absolute = URL.parse(target);
  return absolute ? URL.parse(`${BASE}${absolute.pathname}${absolute.search}`) : null;
}
