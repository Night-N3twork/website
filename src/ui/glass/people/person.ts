import type { PersonView } from './PersonCard';

interface PersonSource {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function toPerson(source: PersonSource, note: string | null = null, link: string | null = null): PersonView {
  return { id: source.id, name: source.name, avatar: source.avatarUrl ?? `/api/users/${source.id}/avatar`, note, link };
}
