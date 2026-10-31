import type { ProductGroup, Stage } from '@/content/projects';
import type { RowItem } from '../parts';

export type StageLabels = Record<Stage, string>;

export interface ProductsCopy {
  eyebrow: string;
  title: string;
  lede: string;
  items: RowItem[];
}

export interface CatalogTab {
  key: ProductGroup;
  label: string;
  items: RowItem[];
}

export interface CatalogCopy {
  title: string;
  lede: string;
  tabs: CatalogTab[];
}

export interface FlagshipCopy {
  kicker: string;
  title: string;
  line: string;
  notes: string[];
  stage: Stage;
}

export interface CommunityCallCopy {
  title: string;
  lede: string;
  discord: string;
}
