import type { DocsLabels, DocsPageData, PagerLink } from '@/lib/docs/page';
import { docPath } from '@/lib/docs/paths';
import { TransitionLink } from '@/navigation/TransitionLink';
import { Chevron } from '../parts';

function PagerCard({ link, dir, label }: { link: PagerLink; dir: 'previous' | 'next'; label: string }) {
  return (
    <TransitionLink className="docs-pager-link cut" data-dir={dir} to={docPath(link.slug)}>
      <span className="docs-pager-dir">
        <Chevron />
        {label}
      </span>
      <span className="docs-pager-title" lang="en">
        {link.title}
      </span>
    </TransitionLink>
  );
}

export function DocsPager({ pager, labels }: { pager: DocsPageData['pager']; labels: DocsLabels }) {
  if (!pager.previous && !pager.next) return null;
  return (
    <nav className="docs-pager" aria-label={labels.pager}>
      {pager.previous ? <PagerCard link={pager.previous} dir="previous" label={labels.previous} /> : <span />}
      {pager.next ? <PagerCard link={pager.next} dir="next" label={labels.next} /> : null}
    </nav>
  );
}
