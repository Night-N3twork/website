import { useEffect, useState } from 'react';
import type { TocEntry } from '@/lib/docs/page';

const READING_LINE = 0.34;

function passedHeading(targets: readonly HTMLElement[]): string | null {
  const line = window.innerHeight * READING_LINE;
  return targets.filter((target) => target.getBoundingClientRect().top <= line).at(-1)?.id ?? null;
}

function useActiveHeading(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('\n');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = key
      .split('\n')
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(() => setActive(passedHeading(targets)), { rootMargin: `0px 0px -${Math.round((1 - READING_LINE) * 100)}% 0px` });
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [key]);
  return active;
}

export function DocsToc({ entries, label }: { entries: readonly TocEntry[]; label: string }) {
  const active = useActiveHeading(entries.map((entry) => entry.id));
  return (
    <nav className="docs-toc" aria-label={label}>
      <p className="docs-toc-title">{label}</p>
      <ol className="docs-toc-list" lang="en">
        {entries.map((entry) => (
          <li key={entry.id} data-depth={entry.depth}>
            <a className="docs-toc-link" href={`#${entry.id}`} aria-current={entry.id === active ? 'location' : undefined}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
