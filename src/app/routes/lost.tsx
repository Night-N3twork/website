import { data } from 'react-router';
import { Lost, useLostCopy } from '@/ui/glass/Lost';
import { lostMeta, rootLost } from '../head';
import type { Route } from './+types/lost';

export function loader() {
  return data({ status: 404 }, { status: 404 });
}

export const meta: Route.MetaFunction = ({ matches }) => lostMeta(rootLost(matches));

export default function LostRoute() {
  return <Lost status={404} copy={useLostCopy()} />;
}
