import type { ReactNode } from 'react';
import { Section } from '../parts';

export interface PeopleHeadCopy {
  kicker: string;
  title: string;
  lede: string;
}

export function PeopleHead({ copy, children }: { copy: PeopleHeadCopy; children?: ReactNode }) {
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
        {children ? (
          <div className="actions" data-intro="">
            {children}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
