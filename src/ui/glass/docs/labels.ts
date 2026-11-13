import { createContext, use } from 'react';
import type { DocsLabels } from '@/lib/docs/page';

export const DocsLabelsContext = createContext<DocsLabels | null>(null);

export function useDocsLabels(): DocsLabels {
  const labels = use(DocsLabelsContext);
  if (!labels) throw new Error('docs labels are missing');
  return labels;
}
