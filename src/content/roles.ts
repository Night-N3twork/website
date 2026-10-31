export const ROLES = [
  { id: 'owner' },
  { id: 'co-owner' },
  { id: 'director' },
  { id: 'developer' },
  { id: 'admin' },
  { id: 'mod' },
  { id: 'marketer' },
] as const;
export type RoleId = (typeof ROLES)[number]['id'];
