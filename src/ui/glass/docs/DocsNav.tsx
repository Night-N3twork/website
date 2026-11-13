import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { docPath } from '@/lib/docs/paths';
import { groupHolds, type NavGroup, type NavNode } from '@/lib/docs/sidebar';
import { setSmoothWheel } from '@/motion/core';
import { TransitionLink } from '@/navigation/TransitionLink';

interface NavProps {
  nodes: readonly NavNode[];
  current: string;
}

function NavList({ nodes, current, lang }: NavProps & { lang?: string }) {
  return (
    <ul className="docs-nav-list" lang={lang}>
      {nodes.map((node) => (
        <li key={node.kind === 'link' ? node.slug : `group:${node.label}`}>
          {node.kind === 'link' ? (
            <TransitionLink className="docs-nav-link" to={docPath(node.slug)} aria-current={node.slug === current ? 'page' : undefined}>
              {node.label}
            </TransitionLink>
          ) : (
            <NavFold group={node} current={current} />
          )}
        </li>
      ))}
    </ul>
  );
}

function NavFold({ group, current }: { group: NavGroup; current: string }) {
  const holds = groupHolds(group, current);
  return (
    <details className="docs-nav-fold" open={holds || !group.collapsed} data-holds={holds || undefined}>
      <summary className="docs-nav-summary">{group.label}</summary>
      <NavList nodes={group.items} current={current} />
    </details>
  );
}

function NavSection({ group, current }: { group: NavGroup; current: string }) {
  const id = useId();
  return (
    <div className="docs-nav-section" role="group" aria-labelledby={id} lang="en">
      <p className="docs-nav-heading" id={id}>
        {group.label}
      </p>
      <NavList nodes={group.items} current={current} />
    </div>
  );
}

function revealCurrent(box: HTMLElement): void {
  const link = box.querySelector<HTMLElement>('[aria-current="page"]');
  if (!link || box.scrollHeight <= box.clientHeight) return;
  const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top;
  if (top >= 0 && top + link.offsetHeight <= box.clientHeight) return;
  box.scrollTop += top - (box.clientHeight - link.offsetHeight) / 2;
}

export function DocsNav({ nodes, current, label }: NavProps & { label: string }) {
  const [open, setOpen] = useState(false);
  const side = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (side.current) revealCurrent(side.current);
  }, [current]);
  useEffect(() => {
    setSmoothWheel(false);
    return () => setSmoothWheel(true);
  }, []);
  return (
    <div className="docs-side" ref={side} data-open={open} data-lenis-prevent="">
      <button type="button" className="docs-side-toggle" aria-expanded={open} aria-controls="docs-nav" onClick={() => setOpen((was) => !was)}>
        <span>{label}</span>
        <span className="docs-side-bars" aria-hidden="true" />
      </button>
      <nav className="docs-nav" id="docs-nav" aria-label={label}>
        {nodes.map((node) =>
          node.kind === 'group' ? (
            <NavSection key={node.label} group={node} current={current} />
          ) : (
            <NavList key={node.slug} nodes={[node]} current={current} lang="en" />
          ),
        )}
      </nav>
    </div>
  );
}
