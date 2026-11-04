import type { PersonView } from './PersonCard';

interface PersonSource {
  id: string;
  name: string;
}

export function toPerson(source: PersonSource, note: string | null = null, link: string | null = null): PersonView {
  return { id: source.id, name: source.name, avatar: `/api/users/${source.id}/avatar`, note, link };
}
