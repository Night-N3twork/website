import type { DirectorySection } from '@/lib/docs/page';
import { docPath } from '@/lib/docs/paths';
import { TransitionLink } from '@/navigation/TransitionLink';
import { pad } from '../parts';

function DirectoryBlock({ section, index }: { section: DirectorySection; index: number }) {
  return (
    <section className="docs-dir-section" data-kind={section.kind}>
      <h2 className="docs-dir-title">
        <span className="docs-dir-count" aria-hidden="true">
          {pad(index + 1)}
        </span>
        {section.label}
      </h2>
      <ul className="docs-dir-list">
        {section.entries.map((entry) => (
          <li key={entry.slug}>
            <TransitionLink className="docs-dir-link" to={docPath(entry.slug)}>
              <span className="docs-dir-name">{entry.title}</span>
              {entry.description ? <span className="docs-dir-line">{entry.description}</span> : null}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocsDirectory({ sections }: { sections: readonly DirectorySection[] }) {
  return (
    <div className="docs-dir" lang="en">
      {sections.map((section, index) => (
        <DirectoryBlock key={section.label} section={section} index={index} />
      ))}
    </div>
  );
}
