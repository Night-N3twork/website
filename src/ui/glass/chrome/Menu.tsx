import { type CSSProperties, type KeyboardEvent, type RefObject, useEffect, useRef } from 'react';
import type { Chrome } from '@/app/chrome';
import type { LanguageLink } from '@/i18n/languages';
import { TransitionLink } from '@/navigation/TransitionLink';
import { isCurrent } from './current';
import { ExternalLink } from './ExternalLink';
import { LanguageLinks } from './LanguageLinks';

interface MenuProps {
  chrome: Chrome;
  path: string;
  languages: LanguageLink[];
  open: boolean;
  onClose: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE = 'a[href], button:not([disabled])';
const step = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties;

function trapTab(e: KeyboardEvent<HTMLDialogElement>): void {
  if (e.key !== 'Tab') return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const first = items[0];
  const last = items.at(-1);
  if (!first || !last) return;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function useDialog(open: boolean, trigger: RefObject<HTMLButtonElement | null>): RefObject<HTMLDialogElement | null> {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) {
      el.close();
      trigger.current?.focus();
    }
  }, [open, trigger]);
  return dialog;
}

export function Menu({ chrome, path, languages, open, onClose, trigger }: MenuProps) {
  const dialog = useDialog(open, trigger);
  const { labels } = chrome;
  return (
    <dialog className="menu cut" id="site-menu" ref={dialog} data-lenis-prevent="" aria-label={labels.menu} onCancel={(e) => (e.preventDefault(), onClose())} onClose={onClose} onKeyDown={trapTab}>
      <button type="button" className="menu-close" onClick={onClose}>
        {labels.close}
      </button>
      <nav className="menu-nav" aria-label={labels.menu}>
        <ul>
          {chrome.nav.map((item, i) => (
            <li key={item.key} className="menu-item" style={step(i)}>
              <TransitionLink to={item.path} aria-current={isCurrent(path, item.path) ? 'page' : undefined} onClick={onClose}>
                {item.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="menu-item menu-meta" style={step(chrome.nav.length)}>
        <LanguageLinks label={labels.language} currentLabel={labels.languageCurrent} path={path} languages={languages} onPick={onClose} />
        <ul className="menu-socials">
          {[...chrome.socials, ...chrome.support].map((link) => (
            <li key={link.label}>
              <ExternalLink href={link.href}>{link.label}</ExternalLink>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
