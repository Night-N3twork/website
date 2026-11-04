import type { LegalSection } from '@/content/legal-pages';

export interface LegalIndexProps {
  label: string;
  sections: readonly LegalSection[];
}

export function LegalIndex({ label, sections }: LegalIndexProps) {
  return (
    <nav className="legal-index" aria-label={label}>
      <ol className="legal-index-list">
        {sections.map((section) => (
          <li key={section.id}>
            <a className="legal-index-link" href={`#${section.id}`}>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
