import type { AnalyticsTags } from './analytics';

const MARK = 'data-night-analytics';
const GA_COOKIE = /^_ga(?:_|$)/;

const disableKey = (tags: AnalyticsTags): string => `ga-disable-${tags.id}`;

export function readPageNonce(doc: Document = document): string {
  const el = doc.querySelector<HTMLScriptElement>('script[nonce]');
  if (!el) return '';
  return el.nonce || el.getAttribute('nonce') || '';
}

function nonced(doc: Document, nonce: string): HTMLScriptElement {
  const script = doc.createElement('script');
  script.setAttribute(MARK, '');
  if (nonce) script.setAttribute('nonce', nonce);
  return script;
}

export function loadAnalytics(tags: AnalyticsTags, doc: Document = document): void {
  if (doc.defaultView) Reflect.deleteProperty(doc.defaultView, disableKey(tags));
  if (doc.querySelector(`script[${MARK}]`)) return;
  const nonce = readPageNonce(doc);
  const loader = nonced(doc, nonce);
  loader.async = true;
  loader.src = tags.loader;
  const setup = nonced(doc, nonce);
  setup.textContent = tags.setup;
  doc.head.append(loader, setup);
}

function cookieDomains(hostname: string): string[] {
  const parts = hostname.split('.');
  return parts.length < 2 ? [] : parts.slice(0, -1).map((_, i) => parts.slice(i).join('.'));
}

export function stopAnalytics(tags: AnalyticsTags, win: Window = window): void {
  Reflect.set(win, disableKey(tags), true);
  const doc = win.document;
  const names = doc.cookie
    .split(';')
    .map((pair) => pair.split('=')[0]?.trim() ?? '')
    .filter((name) => GA_COOKIE.test(name));
  const domains = cookieDomains(win.location.hostname);
  for (const name of names) {
    doc.cookie = `${name}=; Max-Age=0; path=/`;
    for (const domain of domains) doc.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
  }
}
