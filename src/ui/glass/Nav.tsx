import { useRef, useState } from 'react';
import type { Chrome } from '@/app/chrome';
import type { LanguageLink } from '@/i18n/languages';
import { TransitionLink } from '@/navigation/TransitionLink';
import { isCurrent } from './chrome/current';
import { Menu } from './chrome/Menu';
import { Mark } from './parts';

const BRAND = 'Night Network';

export function Nav({ chrome, path, languages }: { chrome: Chrome; path: string; languages: LanguageLink[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <header className="nav">
      <TransitionLink className="brand" to="/">
        <Mark size={30} id="nav-cut" />
        <span>{BRAND}</span>
      </TransitionLink>
      <nav className="nav-links" aria-label="Main navigation" data-lift-group="">
        {chrome.nav.map((item) => (
          <TransitionLink key={item.key} to={item.path} data-lift="" aria-current={isCurrent(path, item.path) ? 'page' : undefined}>
            {item.label}
          </TransitionLink>
        ))}
      </nav>
      <button type="button" className="menu-trigger" ref={trigger} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
        <span className="menu-bars" aria-hidden="true">
          <span />
          <span />
        </span>
        {chrome.labels.menu}
      </button>
      <Menu chrome={chrome} path={path} languages={languages} open={open} onClose={() => setOpen(false)} trigger={trigger} />
    </header>
  );
}
