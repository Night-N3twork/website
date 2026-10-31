const GTAG = 'https://www.googletagmanager.com/gtag/js';
export const MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

export type AnalyticsTags = { loader: string; setup: string };

export function analyticsTags(gaId: string | null): AnalyticsTags | null {
  if (!gaId || !MEASUREMENT_ID.test(gaId)) return null;
  return {
    loader: `${GTAG}?id=${encodeURIComponent(gaId)}`,
    setup: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}')`,
  };
}
