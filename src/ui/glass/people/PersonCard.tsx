import { ExternalLink } from '../chrome/ExternalLink';
import { Chevron } from '../parts';

export interface PersonView {
  id: string;
  name: string;
  avatar: string | null;
  note: string | null;
  link: string | null;
}

const AVATAR_SIZE = 48;

function Inner({ person }: { person: PersonView }) {
  return (
    <>
      {person.avatar ? <img className="person-avatar" src={person.avatar} width={AVATAR_SIZE} height={AVATAR_SIZE} loading="lazy" decoding="async" alt="" /> : <span className="person-avatar" aria-hidden="true" />}
      <span className="person-name">{person.name}</span>
      {person.note ? <span className="person-note">{person.note}</span> : null}
      {person.link ? <Chevron /> : null}
    </>
  );
}

export function PersonCard({ person }: { person: PersonView }) {
  return (
    <li className="person">
      {person.link ? (
        <ExternalLink className="person-card" href={person.link}>
          <Inner person={person} />
        </ExternalLink>
      ) : (
        <div className="person-card">
          <Inner person={person} />
        </div>
      )}
    </li>
  );
}
