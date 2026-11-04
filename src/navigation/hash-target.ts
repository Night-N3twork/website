export interface SplitHash {
  path: string;
  hash: string;
}

export function splitHash(to: string): SplitHash {
  const at = to.indexOf('#');
  return at < 0 ? { path: to, hash: '' } : { path: to.slice(0, at), hash: to.slice(at) };
}

export function hashTarget(hash: string): HTMLElement | null {
  if (hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

export function hashTop(target: HTMLElement): number {
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  return Math.max(0, target.getBoundingClientRect().top + scrollY - margin);
}
