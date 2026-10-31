import type { ReactNode } from 'react';
import { pad, Section } from '../parts';
import { PersonCard, type PersonView } from './PersonCard';

export interface PeopleGroupView {
  key: string;
  title: string;
  subnote?: string | null;
  people: PersonView[];
  note: string | null;
}

export function PeopleGroup({ group }: { group: PeopleGroupView }) {
  return (
    <div className="people-group" data-group={group.key}>
      <header className="people-head" data-reveal="">
        <h2 className="people-title">{group.title}</h2>
        {group.subnote ? <p className="people-subnote">{group.subnote}</p> : null}
        <span className="people-count">{pad(group.people.length)}</span>
      </header>
      <div className="people-panel cut" data-reveal="">
        {group.note ? (
          <p className="people-note">{group.note}</p>
        ) : (
          <ul className="people-grid">
            {group.people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PeopleList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Section frame="list" side="left" aria-label={label}>
      <div className="people">{children}</div>
    </Section>
  );
}

export function RoleGroups({ label, groups }: { label: string; groups: PeopleGroupView[] }) {
  return (
    <PeopleList label={label}>
      {groups.map((group) => (
        <PeopleGroup key={group.key} group={group} />
      ))}
    </PeopleList>
  );
}
