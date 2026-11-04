import { LEGAL_FACTS, legalStage, type LegalStage } from '@/content/legal-facts';
import { env } from '@/lib/env';

export const LEGAL_STAGE: LegalStage = legalStage(LEGAL_FACTS, env.legalPreview);
