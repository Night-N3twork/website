import en from '../../messages/en.json';
import type { Locale } from './locales';

export type Messages = typeof en;
type Leaf = string | string[];
type Tree = { [key: string]: Leaf | Tree };

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function mergeLeaf(baseValue: Leaf, partialValue: unknown): Leaf {
  if (typeof baseValue === 'string') return typeof partialValue === 'string' ? partialValue : baseValue;
  return isStringList(partialValue) ? [...partialValue] : baseValue;
}

export function mergeMessages<T extends Tree>(base: T, partial: Partial<Tree>): T {
  const out: Tree = {};
  for (const key of Object.keys(base)) {
    const baseValue = base[key];
    const partialValue = partial[key];
    out[key] = isTree(baseValue) ? (isTree(partialValue) ? mergeMessages(baseValue, partialValue) : baseValue) : mergeLeaf(baseValue, partialValue);
  }
  return out as T;
}

const partials: Record<Exclude<Locale, 'en'>, () => Promise<{ default: Partial<Tree> }>> = {
  es: () => import('../../messages/es.json'),
  fr: () => import('../../messages/fr.json'),
  ja: () => import('../../messages/ja.json'),
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === 'en') return en;
  const { default: partial } = await partials[locale]();
  return mergeMessages(en, partial);
}
