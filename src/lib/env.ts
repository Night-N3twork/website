import { SITE } from '@/content/site';
import { MEASUREMENT_ID } from './analytics';

const RENAMED = { NEXT_PUBLIC_SITE_URL: 'SITE_URL', NEXT_PUBLIC_GA_ID: 'GA_ID' } as const;

export type Env = { siteUrl: string; gaId: string | null; legalPreview: boolean };

export function readEnv(source: Record<string, string | undefined>): Env {
  const stale = Object.entries(RENAMED).find(([old]) => source[old]);
  if (stale) throw new Error(`Invalid environment: ${stale[0]} is now ${stale[1]}`);
  const rawUrl = source.SITE_URL === '' ? undefined : source.SITE_URL;
  const siteUrl = (rawUrl ?? SITE.baseUrl).replace(/\/$/, '');
  try {
    const parsed = new URL(siteUrl);
    if (parsed.protocol !== 'https:') throw new Error();
  } catch {
    throw new Error('Invalid environment: SITE_URL: must be an https URL');
  }
  const rawGa = source.GA_ID === '' ? undefined : source.GA_ID;
  if (rawGa && !MEASUREMENT_ID.test(rawGa)) {
    throw new Error('Invalid environment: GA_ID: must be a Google Analytics 4 measurement id such as G-XXXXXXXXXX');
  }
  return { siteUrl, gaId: rawGa ?? null, legalPreview: source.LEGAL_PREVIEW === '1' };
}

export const env: Env = readEnv(typeof process === 'undefined' ? {} : process.env);
