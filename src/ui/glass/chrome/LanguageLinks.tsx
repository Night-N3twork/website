import type { LanguageLink } from '@/i18n/languages';
import { TransitionLink } from '@/navigation/TransitionLink';

interface LanguageLinksProps {
  label: string;
  currentLabel: string;
  path: string;
  languages: LanguageLink[];
  onPick?: () => void;
}

export function LanguageLinks({ label, currentLabel, path, languages, onPick }: LanguageLinksProps) {
  return (
    <nav className="langs" aria-label={label}>
      <ul>
        {languages.map((language) => (
          <li key={language.locale}>
            <TransitionLink to={path} locale={language.locale} hrefLang={language.locale} lang={language.locale} aria-current={language.current ? 'true' : undefined} title={language.current ? currentLabel : undefined} onClick={onPick}>
              {language.name}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
