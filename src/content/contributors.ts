import type { RoleId } from './roles';

export type Contributor = { readonly id: string; readonly name: string; readonly role: RoleId; readonly link: string | null };

export const CONTRIBUTORS: readonly Contributor[] = [
  { id: '1199165998998245377', name: 'Amplify', role: 'owner', link: 'https://amplifydev.tech' },
  { id: '840728662772023357', name: 'KDust7', role: 'owner', link: 'https://guns.lol/kdust7' },
  { id: '713488984596021291', name: 'Crllect', role: 'owner', link: 'https://crllect.dev' },
  { id: '1012095822957133976', name: 'soap phia', role: 'owner', link: null },
  { id: '997203884428767282', name: 'Bearcat', role: 'co-owner', link: 'https://bears.codes' },
  { id: '520334606206107653', name: 'SNOOT', role: 'co-owner', link: null },
  { id: '1089613026040225964', name: 'Kay', role: 'director', link: null },
  { id: '715182388879163402', name: 'sandstorm', role: 'developer', link: null },
  { id: '988950574387068968', name: 'xmb9', role: 'admin', link: null },
  { id: '1066783543268745286', name: 'Erpt77', role: 'mod', link: null },
  { id: '914227730034327613', name: 'Atrixity', role: 'mod', link: null },
  { id: '1009912279833247744', name: 'rxx', role: 'mod', link: null },
  { id: '851589646671806474', name: 'Avaian', role: 'mod', link: null },
  { id: '1385447526814973953', name: 'v4.0.4', role: 'mod', link: null },
  { id: '405896057139232778', name: 'Synaptic', role: 'mod', link: null },
  { id: '1121672562053759076', name: 'enzo', role: 'marketer', link: null },
];

export function contributorsIn(role: RoleId): Contributor[] {
  return CONTRIBUTORS.filter((contributor) => contributor.role === role);
}
