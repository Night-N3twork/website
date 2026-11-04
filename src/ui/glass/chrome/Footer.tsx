import type { ReactNode } from 'react';
import type { Chrome, LegalColumn } from '@/app/chrome';
import type { LanguageLink } from '@/i18n/languages';
import { openConsent } from '@/lib/consent';
import { TransitionLink } from '@/navigation/TransitionLink';
import { Mark } from '../parts';
import { ExternalLink } from './ExternalLink';
import { LanguageLinks } from './LanguageLinks';

const WORD = 'Night Network';

function FootColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="foot-col">
      <h2 className="foot-title">{title}</h2>
      <ul>{children}</ul>
    </div>
  );
}

function LegalLinks({ legal }: { legal: LegalColumn }) {
  return (
    <FootColumn title={legal.title}>
      {legal.links.map((link) => (
        <li key={link.key}>
          <TransitionLink to={link.path}>{link.label}</TransitionLink>
        </li>
      ))}
      {legal.cookieSettings && (
        <li>
          <button type="button" className="foot-link" onClick={() => openConsent()}>
            {legal.cookieSettings}
          </button>
        </li>
      )}
    </FootColumn>
  );
}

export function Footer({ chrome, path, languages }: { chrome: Chrome; path: string; languages: LanguageLink[] }) {
  const { footer, labels, legal } = chrome;
  return (
    <footer className="foot">
      <div className="foot-top" data-legal={legal ? '' : undefined}>
        <TransitionLink className="brand" to="/">
          <Mark size={26} id="foot-cut" />
          <span>{WORD}</span>
        </TransitionLink>
        <p className="foot-blurb">{footer.blurb}</p>
        <div className="foot-cols" data-lift-group="">
          <FootColumn title={footer.explore}>
            {chrome.nav.map((item) => (
              <li key={item.key}>
                <TransitionLink to={item.path} data-lift="">
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </FootColumn>
          <FootColumn title={footer.connect}>
            {chrome.socials.map((social) => (
              <li key={social.name}>
                <ExternalLink href={social.href}>{social.label}</ExternalLink>
              </li>
            ))}
          </FootColumn>
          <FootColumn title={footer.support}>
            {chrome.support.map((link) => (
              <li key={link.label}>
                <ExternalLink href={link.href}>{link.label}</ExternalLink>
              </li>
            ))}
          </FootColumn>
          {legal && <LegalLinks legal={legal} />}
        </div>
      </div>
      <LanguageLinks label={labels.language} currentLabel={labels.languageCurrent} path={path} languages={languages} />
      <p className="foot-word" aria-hidden="true">
        {[...WORD].map((ch, i) => (
          <span key={i} className="foot-char">
            {ch === ' ' ? '\u00a0' : ch}
          </span>
        ))}
      </p>
      <p className="foot-base">{footer.copyright}</p>
    </footer>
  );
}
