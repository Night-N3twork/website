import type { LegalStage } from '@/content/legal-facts';
import { LEGAL_PATHS } from '@/content/legal-pages';
import type { Translate } from '@/i18n/translate';
import type { ConductCopy } from '@/ui/glass/community/Community';

const TERMS_CLAUSE = '#acceptable-use';

export function conductCopy(t: Translate, stage: LegalStage): ConductCopy {
  const title = t('community.conduct');
  const linkLabel = t('community.conductLink');
  if (stage === 'held') return { title, text: t('community.conductPending'), href: null, linkLabel };
  return { title, text: t('community.conductText'), href: `${LEGAL_PATHS.terms}${TERMS_CLAUSE}`, linkLabel };
}
