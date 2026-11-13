import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

const DOC_WAIT_MS = 3000;

async function loadRenderedDoc(): Promise<void> {
  const file = document.querySelector<HTMLElement>('[data-doc]')?.dataset.doc;
  if (!file) return;
  const { preload } = await import('@/ui/glass/docs/content');
  await preload(file);
}

function hydrate(): void {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>,
    );
  });
}

const giveUp = new Promise<void>((done) => setTimeout(done, DOC_WAIT_MS));

void Promise.race([loadRenderedDoc(), giveUp]).catch(reportError).finally(hydrate);
