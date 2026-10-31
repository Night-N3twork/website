import { IntlMessageFormat } from 'intl-messageformat';
import type { Locale } from './locales';
import { loadMessages } from './messages';

export type MessageValues = Record<string, string | number | Date>;
export type Translate = ((key: string, values?: MessageValues) => string) & { raw: (key: string) => unknown };

const formats = new Map<string, IntlMessageFormat>();

function lookup(tree: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), tree);
}

function missing(path: string): string {
  if (import.meta.env.PROD) return path;
  throw new Error(`missing message: ${path}`);
}

function formatFor(locale: Locale, path: string, message: string): IntlMessageFormat {
  const id = `${locale}:${path}`;
  const known = formats.get(id);
  if (known) return known;
  const format = new IntlMessageFormat(message, locale);
  formats.set(id, format);
  return format;
}

export async function translator(locale: Locale, namespace?: string): Promise<Translate> {
  const messages = await loadMessages(locale);
  const pathOf = (key: string) => (namespace ? `${namespace}.${key}` : key);
  const translate = (key: string, values?: MessageValues): string => {
    const path = pathOf(key);
    const message = lookup(messages, path);
    if (typeof message !== 'string') return missing(path);
    return String(formatFor(locale, path, message).format(values));
  };
  return Object.assign(translate, { raw: (key: string) => lookup(messages, pathOf(key)) });
}
