import type { Page } from '@playwright/test';

const FILLER = 'àéîõü ŷçñ ';

export function padText(page: Page, ratio = 0.4): Promise<void> {
  return page.evaluate(
    ({ ratio, filler }) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => (node.parentElement?.closest('script, style, noscript') || !node.textContent?.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      for (const node of nodes) {
        const text = node.textContent ?? '';
        const extra = Math.ceil(text.trim().length * ratio);
        node.textContent = `${text} ${filler.repeat(Math.ceil(extra / filler.length)).slice(0, extra).trim()}`;
      }
    },
    { ratio, filler: FILLER },
  );
}
