import { z } from 'zod';
import { fillFacts, LEGAL_FACTS, type LegalFacts, type LegalStage } from '@/content/legal-facts';
import { GRAPH_NODES, type LegalGraphCopy } from '@/content/legal-graph';
import { LEGAL_UPDATED, type LegalHead, type LegalKind, type LegalPageData, type LegalSection } from '@/content/legal-pages';
import type { Locale } from '@/i18n/locales';
import { type Translate, translator } from '@/i18n/translate';
import { LEGAL_STAGE } from '@/lib/legal-stage';
import { headModel } from '@/lib/seo/head';

const sectionSchema = z.object({ title: z.string().min(1), body: z.array(z.string().min(1)).min(1) });
const orderSchema = z
  .array(z.string().min(1))
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length);

export type LegalOptions = { stage?: LegalStage; facts?: LegalFacts };

export function readSections(order: readonly string[], rawSection: (id: string) => unknown): LegalSection[] {
  return order.map((id) => {
    const parsed = sectionSchema.safeParse(rawSection(id));
    if (!parsed.success) throw new Error(`missing legal section: ${id}`);
    return { id, title: parsed.data.title, body: parsed.data.body };
  });
}

function readOrder(t: Translate, kind: LegalKind): string[] {
  const parsed = orderSchema.safeParse(t.raw(`${kind}.order`));
  if (!parsed.success) throw new Error(`invalid legal order: ${kind}`);
  return parsed.data;
}

function longDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
}

function legalHead(t: Translate, kind: LegalKind, locale: Locale): LegalHead {
  return {
    kicker: t(`${kind}.kicker`),
    title: t(`${kind}.title`),
    lede: t(`${kind}.lede`),
    updated: t('updated', { date: longDate(LEGAL_UPDATED[kind], locale) }),
    contents: t('contents'),
    notice: locale === 'en' ? null : t('notice'),
  };
}

function graphCopy(t: Translate): LegalGraphCopy {
  return {
    heading: t('graph.heading'),
    listHeading: t('graph.listHeading'),
    collects: t('graph.collects'),
    shares: t('graph.shares'),
    separator: t('graph.separator'),
    labels: Object.fromEntries(GRAPH_NODES.map((node) => [node.id, t(`graph.nodes.${node.id}`)])),
  };
}

export async function legalPage(kind: LegalKind, locale: Locale, path: string, { stage = LEGAL_STAGE, facts = LEGAL_FACTS }: LegalOptions = {}): Promise<LegalPageData> {
  if (stage === 'held') throw new Response(null, { status: 404, statusText: 'Not Found' });
  const t = await translator(locale, 'legal');
  const head = legalHead(t, kind, locale);
  const sections = readSections(readOrder(t, kind), (id) => t.raw(`${kind}.sections.${id}`)).map((section) => ({ ...section, body: section.body.map((paragraph) => fillFacts(paragraph, facts)) }));
  const seo = { ...headModel({ locale, path, title: head.title, description: head.lede }), index: stage === 'live' };
  return { kind, stage, seo, head, sections, graph: kind === 'privacy' ? graphCopy(t) : null };
}
