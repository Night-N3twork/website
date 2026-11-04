import type { InternalPath } from '@/i18n/paths';
import type { HeadModel } from '@/lib/seo/head';
import type { LegalGraphCopy } from './legal-graph';

export type LegalKind = 'privacy' | 'terms' | 'requests';

export const LEGAL_PATHS: Record<LegalKind, InternalPath> = { privacy: '/privacy', terms: '/terms', requests: '/requests' };

export const LEGAL_UPDATED: Record<LegalKind, string> = { privacy: '2026-11-03', terms: '2026-11-03', requests: '2026-11-03' };

export type LegalSection = { id: string; title: string; body: string[] };

export type LegalHead = { kicker: string; title: string; lede: string; updated: string; contents: string; notice: string | null };

export type LegalPageData = {
  kind: LegalKind;
  stage: 'preview' | 'live';
  seo: HeadModel;
  head: LegalHead;
  sections: LegalSection[];
  graph: LegalGraphCopy | null;
};
