import type { PersonView } from './PersonCard';

const DISCORD_ID = /^\d{17,20}$/;

interface PersonSource {
  id: string;
  name: string;
}

export function toPerson(source: PersonSource, note: string | null = null, link: string | null = null): PersonView {
  return { id: source.id, name: source.name, avatar: DISCORD_ID.test(source.id) ? `/api/users/${source.id}/avatar` : null, note, link };
}
