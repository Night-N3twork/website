// Minimal type-safe i18n helper.
// - Loads all locale catalogs at build time (static imports = zero runtime cost).
// - `t(key, locale, vars?)` does dotted-path lookup, falls back to English.
// - `extractLocaleFromPath(pathname)` and `pathFor(locale, pathname)` handle the
//   `/`, `/es/...`, `/fr/...`, `/ja/...` URL convention.

import en from '@i18n/en.json';
import es from '@i18n/es.json';
import fr from '@i18n/fr.json';
import ja from '@i18n/ja.json';

export const LOCALES = ['en', 'es', 'fr', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie name used to remember an explicit user locale choice. */
export const LOCALE_COOKIE = 'nn_locale';
/** Cookie lifetime in seconds (1 year). */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// English catalog is the source of truth — its shape defines the valid key
// universe. Other catalogs are forced to the same shape; missing keys at
// runtime silently fall back to English.
const catalogs: Record<Locale, typeof en> = {
	en,
	es: es as typeof en,
	fr: fr as typeof en,
	ja: ja as typeof en
};

// Build a flat dotted-key map per locale for O(1) lookups.
function flatten(obj: unknown, prefix = ''): Record<string, string> {
	const out: Record<string, string> = {};
	if (obj === null || typeof obj !== 'object') return out;
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		const path = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			Object.assign(out, flatten(v, path));
		} else if (typeof v === 'string') {
			out[path] = v;
		}
	}
	return out;
}

const flatCatalogs: Record<Locale, Record<string, string>> = {
	en: flatten(catalogs.en),
	es: flatten(catalogs.es),
	fr: flatten(catalogs.fr),
	ja: flatten(catalogs.ja)
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (m, name) => {
		const v = vars[name];
		return v === undefined ? m : String(v);
	});
}

/**
 * Look up a translation. Falls back to English if missing in `locale`,
 * and to the raw key if missing in English too (which signals a bug).
 */
export function t(key: string, locale: Locale, vars?: Record<string, string | number>): string {
	const value =
		flatCatalogs[locale]?.[key] ?? flatCatalogs.en?.[key] ?? key;
	return interpolate(value, vars);
}

/** Curry a t() helper bound to a single locale. */
export function tFor(locale: Locale): (key: string, vars?: Record<string, string | number>) => string {
	return (key, vars) => t(key, locale, vars);
}

/** Type guard. */
export function isLocale(v: string | undefined | null): v is Locale {
	return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/**
 * Read the locale segment off a URL pathname.
 * `/es/projects` → 'es', `/projects` → 'en' (the default).
 */
export function extractLocaleFromPath(pathname: string): Locale {
	const seg = pathname.split('/').filter(Boolean)[0];
	return isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * Strip any locale prefix from a path, returning the canonical English path.
 * `/es/projects` → '/projects', `/ja` → '/', `/projects` → '/projects'.
 */
export function stripLocale(pathname: string): string {
	const segs = pathname.split('/').filter(Boolean);
	if (segs.length > 0 && isLocale(segs[0])) {
		const rest = segs.slice(1).join('/');
		return rest ? `/${rest}` : '/';
	}
	return pathname === '' ? '/' : pathname;
}

/**
 * Build the URL for a given locale + canonical (English) pathname.
 * `pathFor('es', '/projects')` → '/es/projects'
 * `pathFor('en', '/projects')` → '/projects'
 */
export function pathFor(locale: Locale, canonical: string): string {
	const normalized = canonical.startsWith('/') ? canonical : `/${canonical}`;
	if (locale === DEFAULT_LOCALE) return normalized;
	if (normalized === '/') return `/${locale}`;
	return `/${locale}${normalized}`;
}

/**
 * Negotiate the best supported locale from an Accept-Language header.
 * Returns null if no acceptable language is found.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale | null {
	if (!acceptLanguage) return null;
	// Parse "en-US,en;q=0.9,es;q=0.8" → [['en-US', 1], ['en', 0.9], ['es', 0.8]]
	const entries = acceptLanguage
		.split(',')
		.map(part => {
			const [tag, ...params] = part.trim().split(';');
			const q = params
				.map(p => p.trim())
				.find(p => p.startsWith('q='));
			const quality = q ? parseFloat(q.slice(2)) : 1;
			return { tag: tag.trim().toLowerCase(), q: isNaN(quality) ? 1 : quality };
		})
		.filter(e => e.tag && e.q > 0)
		.sort((a, b) => b.q - a.q);

	for (const { tag } of entries) {
		// Exact match (e.g. 'es')
		if (isLocale(tag)) return tag;
		// Primary subtag match (e.g. 'es-MX' → 'es')
		const primary = tag.split('-')[0];
		if (isLocale(primary)) return primary;
	}
	return null;
}
