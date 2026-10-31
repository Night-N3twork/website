import type { ReactNode } from 'react';
import { Section } from '../parts';

export interface ProjectsHeadCopy {
  kicker: string;
  title: string;
  lede: string;
}

export function ProjectsHead({ copy, children }: { copy: ProjectsHeadCopy; children?: ReactNode }) {
  return (
    <Section frame="page" side="left" aria-labelledby="page-heading">
      <div className="copy">
        <p className="eyebrow" data-intro="">
          {copy.kicker}
        </p>
        <h1 className="page-title" id="page-heading" tabIndex={-1} data-intro="headline">
          {copy.title}
        </h1>
        <p className="lede" data-intro="">
          {copy.lede}
        </p>
        {children}
      </div>
    </Section>
  );
}
